// app/api/cron/crawl/route.js
// Triggerable by any scheduler (AWS EventBridge Scheduler in production).
// Protected by CRON_SECRET so it can't be triggered by randoms hitting the URL.
//
// Alternates between two search modes on each run:
//  - "priority": high-star repos first (stars:>100), so the site fills with
//    real, popular skills fast instead of crawling alphabetically/randomly
//  - "sweep": the general filename:SKILL.md search, cursor-paginated, for
//    full long-tail coverage over time
// This gives good content quickly without needing to copy anyone else's dataset.

import { searchSkillFiles, getFileContent, getRepoInfo, throttle } from "../../../../lib/github.js";
import { parseSkillContent, hashContent, looksLikeAgentSkill } from "../../../../lib/parse-skill.js";
import { scanContentFlags, canAutoPublish } from "../../../../lib/safety-scan.js";
import { upsertSkill, insertPendingSkill, getCrawlCursor, setCrawlCursor } from "../../../../db/queries.js";

export const maxDuration = 60;

const BATCH_SIZE = parseInt(process.env.CRAWL_BATCH_SIZE || "25", 10);

export async function GET(request) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const state = (await getCrawlCursor("code_search")) || { sweepPage: 1, priorityPage: 1, mode: "priority" };
  const mode = state.mode === "priority" ? "priority" : "sweep";
  const nextMode = mode === "priority" ? "sweep" : "priority";

  const results = { mode, processed: 0, published: 0, queued: 0, rejected_not_skill: 0, errors: 0 };

  try {
    const page = mode === "priority" ? state.priorityPage : state.sweepPage;
    const qualifiers = mode === "priority" ? "stars:>100" : "";

    const searchRes = await searchSkillFiles({ query: qualifiers, page, perPage: BATCH_SIZE });
    const items = searchRes.items || [];

    if (items.length === 0) {
      const resetState = mode === "priority"
        ? { ...state, priorityPage: 1, mode: nextMode }
        : { ...state, sweepPage: 1, mode: nextMode };
      await setCrawlCursor("code_search", resetState);
      return Response.json({ ...results, note: `${mode} exhausted, reset and switching to ${nextMode} next run` });
    }

    for (const item of items) {
      results.processed++;
      try {
        await throttle();

        const owner = item.repository.owner.login;
        const repo = item.repository.name;
        const path = item.path;

        const [content, repoInfo] = await Promise.all([
          getFileContent(owner, repo, path),
          getRepoInfo(owner, repo),
        ]);

        if (!looksLikeAgentSkill(content)) {
          results.rejected_not_skill++;
          continue;
        }

        const parsed = parseSkillContent(content, repo);
        const contentHash = hashContent(content);
        const flagReasons = scanContentFlags(content);

        const skillRecord = {
          name: parsed.name,
          description: parsed.description,
          has_real_desc: parsed.hasRealDesc,
          owner,
          repo,
          path,
          stars: repoInfo.stars,
          license_spdx_id: repoInfo.license,
          content_hash: contentHash,
          raw_url: `https://raw.githubusercontent.com/${owner}/${repo}/${repoInfo.defaultBranch}/${path}`,
          tags: parsed.tags,
          source: "crawler",
          repo_updated_at: repoInfo.updatedAt,
        };

        if (canAutoPublish({ owner, stars: repoInfo.stars, flagReasons })) {
          await upsertSkill(skillRecord);
          results.published++;
        } else {
          await insertPendingSkill({ ...skillRecord, raw_content: content, flag_reasons: flagReasons });
          results.queued++;
        }
      } catch (err) {
        results.errors++;
        console.error("[crawl] item failed:", item.repository?.full_name, item.path, err.message);
      }
    }

    const advancedState = mode === "priority"
      ? { ...state, priorityPage: page + 1 }
      : { ...state, sweepPage: page + 1 };
    await setCrawlCursor("code_search", advancedState);
    return Response.json(results);
  } catch (err) {
    console.error("[crawl] run failed:", err.message);
    return Response.json({ error: err.message, ...results }, { status: 500 });
  }
}
