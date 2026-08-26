// app/api/cron/backfill/route.js
// Re-fetch SKILL.md bodies for rows missing raw_content (thin-content repair).

import { getFileContent, throttle } from "../../../../lib/github.js";
import { parseSkillContent, hashContent, looksLikeAgentSkill } from "../../../../lib/parse-skill.js";
import {
  listSkillsMissingRawContent,
  updateSkillContent,
} from "../../../../db/queries.js";

export const maxDuration = 60;

const LIMIT = parseInt(process.env.BACKFILL_BATCH || "20", 10);

function authorizedCron(request) {
  const expected = process.env.CRON_SECRET || "";
  if (!expected) return false;
  const header = request.headers.get("x-cron-secret") || "";
  const auth = request.headers.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  return header === expected || bearer === expected;
}

export async function GET(request) {
  if (!authorizedCron(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = { attempted: 0, updated: 0, skipped: 0, errors: 0 };
  const rows = await listSkillsMissingRawContent(LIMIT);

  for (const row of rows) {
    results.attempted++;
    try {
      await throttle(1200);
      const content = await getFileContent(row.owner, row.repo, row.path);
      if (!content || !looksLikeAgentSkill(content)) {
        results.skipped++;
        continue;
      }
      const parsed = parseSkillContent(content, row.repo, row.path);
      const contentHash = hashContent(content);
      await updateSkillContent(row.id, {
        raw_content: content,
        description: parsed.hasRealDesc ? parsed.description : row.description,
        has_real_desc: parsed.hasRealDesc || row.has_real_desc,
        tags: parsed.tags?.length ? parsed.tags : row.tags,
        content_hash: contentHash,
      });
      results.updated++;
    } catch (err) {
      results.errors++;
      console.error("[backfill] failed", row.owner, row.repo, row.path, err.message);
    }
  }

  return Response.json(results);
}
