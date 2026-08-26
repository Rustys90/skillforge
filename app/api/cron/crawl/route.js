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
import { upsertSkill, insertPendingSkill, getCrawlCursor, setCrawlCursor, listPendingForPromote, markPendingApproved } from "../../../../db/queries.js";

export const maxDuration = 60;

const BATCH_SIZE = parseInt(process.env.CRAWL_BATCH_SIZE || "15", 10);

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

  const state = (await getCrawlCursor("code_search")) || { sweepPage: 1, priorityPage: 1, mode: "priority" };
  const mode = state.mode === "priority" ? "priority" : "sweep";
  const nextMode = mode === "priority" ? "sweep" : "priority";

  const results = { mode, processed: 0, published: 0, queued: 0, rejected_not_skill: 0, errors: 0, promoted: 0, backfilled: 0 };

  // Drain pending queue for rows that now pass auto-publish policy
  try {
    const pending = await listPendingForPromote(40);
    for (const row of pending) {
      const flagReasons = row.flag_reasons || [];
      if (!canAutoPublish({ owner: row.owner, stars: row.stars, flagReasons })) continue;
      await upsertSkill({
        name: row.name,
        description: row.description,
        has_real_desc: row.has_real_desc,
        owner: row.owner,
        repo: row.repo,
        path: row.path,
        stars: row.stars,
        license_spdx_id: row.license_spdx_id,
        content_hash: row.content_hash,
        raw_url: row.raw_url,
        tags: row.tags,
        source: row.source || "crawler",
        repo_updated_at: row.repo_updated_at,
        // Critical for SEO: skill pages need full SKILL.md body
        raw_content: row.raw_content || null,
      });
      await markPendingApproved(row.id);
      results.promoted++;
      results.published++;
    }
  } catch (err) {
    console.error("[crawl] promote pending failed:", err.message);
  }

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
          // Always store full body so skill pages are not thin (~58 words)
          raw_content: content,
        };

        if (canAutoPublish({ owner, stars: repoInfo.stars, flagReasons })) {
          await upsertSkill(skillRecord);
          results.published++;
        } else {
          await insertPendingSkill({ ...skillRecord, flag_reasons: flagReasons });
          results.queued++;
        }
      } catch (err) {
        results.errors++;
        console.error("[crawl] item failed:", item.repository?.full_name, item.path, err.message);
      }
    }

    const advancedState = mode === "priority"
      ? { ...state, priorityPage: page + 1, mode: nextMode }
      : { ...state, sweepPage: page + 1, mode: nextMode };
    await setCrawlCursor("code_search", advancedState);
    return Response.json(results);
  } catch (err) {
    console.error("[crawl] run failed:", err.message);
    return Response.json({ error: err.message, ...results }, { status: 500 });
  }
}
