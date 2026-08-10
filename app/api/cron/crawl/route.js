// app/api/cron/crawl/route.js
// Triggerable by Vercel Cron OR any external scheduler (see README — Vercel Hobby
// caps built-in Cron at once/day; an external scheduler hitting this same route
// works on any cadence while staying on the free tier).
//
// Protected by CRON_SECRET so it can't be triggered by randoms hitting the URL.

import { searchSkillFiles, getFileContent, getRepoInfo, throttle } from "../../../../lib/github.js";
import { parseSkillContent, hashContent } from "../../../../lib/parse-skill.js";
import { scanContent, canAutoPublish } from "../../../../lib/safety-scan.js";
import { upsertSkill, insertPendingSkill, getCrawlCursor, setCrawlCursor } from "../../../../db/queries.js";

export const maxDuration = 60;

const BATCH_SIZE = parseInt(process.env.CRAWL_BATCH_SIZE || "25", 10);

export async function GET(request) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const cursor = (await getCrawlCursor("code_search")) || { page: 1 };
  const results = { processed: 0, published: 0, queued: 0, errors: 0 };

  try {
    const searchRes = await searchSkillFiles({ page: cursor.page, perPage: BATCH_SIZE });
    const items = searchRes.items || [];

    if (items.length === 0) {
      await setCrawlCursor("code_search", { page: 1 });
      return Response.json({ ...results, note: "no more results, cursor reset to page 1" });
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

        const parsed = parseSkillContent(content, repo);
        const contentHash = hashContent(content);
        const flagReasons = scanContent(content);

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

    await setCrawlCursor("code_search", { page: cursor.page + 1 });
    return Response.json(results);
  } catch (err) {
    console.error("[crawl] run failed:", err.message);
    return Response.json({ error: err.message, ...results }, { status: 500 });
  }
}
