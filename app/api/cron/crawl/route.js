// Multi-strategy GitHub code search + safety gate + raw_content persistence.
import { searchSkillFiles, getFileContent, getRepoInfo, throttle } from "../../../../lib/github.js";
import { parseSkillContent, hashContent, looksLikeAgentSkill } from "../../../../lib/parse-skill.js";
import { scanContentFlags, canAutoPublish } from "../../../../lib/safety-scan.js";
import { upsertSkill, insertPendingSkill, getCrawlCursor, setCrawlCursor, listPendingForPromote, markPendingApproved } from "../../../../db/queries.js";

export const maxDuration = 60;
const BATCH_SIZE = parseInt(process.env.CRAWL_BATCH_SIZE || "12", 10);
const STRATEGIES = [
  { id: "priority", query: "stars:>100" },
  { id: "sweep", query: "" },
  { id: "path_skills", query: "path:skills" },
  { id: "path_claude", query: "path:.claude" },
  { id: "path_cursor", query: "path:.cursor" },
  { id: "path_codex", query: "path:.codex" },
  { id: "size_small", query: "size:<2500" },
  { id: "size_mid", query: "size:2500..12000" },
];

function authorizedCron(request) {
  const expected = process.env.CRON_SECRET || "";
  if (!expected) return false;
  const header = request.headers.get("x-cron-secret") || "";
  const auth = request.headers.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  return header === expected || bearer === expected;
}

export async function GET(request) {
  if (!authorizedCron(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const state = (await getCrawlCursor("code_search")) || { strategyIndex: 0, page: 1, pages: {} };
  const strategyIndex = Number(state.strategyIndex) % STRATEGIES.length;
  const strategy = STRATEGIES[strategyIndex];
  const page = Number(state.pages?.[strategy.id] || state.page || 1);
  const results = { strategy: strategy.id, page, processed: 0, published: 0, queued: 0, rejected_not_skill: 0, errors: 0, promoted: 0 };

  try {
    const pending = await listPendingForPromote(40);
    for (const row of pending) {
      if (!canAutoPublish({ owner: row.owner, stars: row.stars, flagReasons: row.flag_reasons || [] })) continue;
      await upsertSkill({ ...row, source: row.source || "crawler", raw_content: row.raw_content || null });
      await markPendingApproved(row.id);
      results.promoted++; results.published++;
    }
  } catch (err) { console.error("[crawl] promote", err.message); }

  try {
    const searchRes = await searchSkillFiles({ query: strategy.query, page, perPage: BATCH_SIZE });
    const items = searchRes.items || [];
    if (items.length === 0) {
      const pages = { ...(state.pages || {}), [strategy.id]: 1 };
      const nextIndex = (strategyIndex + 1) % STRATEGIES.length;
      await setCrawlCursor("code_search", { strategyIndex: nextIndex, page: 1, pages });
      return Response.json({ ...results, note: `${strategy.id} exhausted; next ${STRATEGIES[nextIndex].id}` });
    }
    for (const item of items) {
      results.processed++;
      try {
        await throttle(1500);
        const owner = item.repository.owner.login;
        const repo = item.repository.name;
        const path = item.path;
        const [content, repoInfo] = await Promise.all([getFileContent(owner, repo, path), getRepoInfo(owner, repo)]);
        if (!looksLikeAgentSkill(content)) { results.rejected_not_skill++; continue; }
        const parsed = parseSkillContent(content, repo, path);
        const skillRecord = {
          name: parsed.name, description: parsed.description, has_real_desc: parsed.hasRealDesc,
          owner, repo, path, stars: repoInfo.stars, license_spdx_id: repoInfo.license,
          content_hash: hashContent(content),
          raw_url: `https://raw.githubusercontent.com/${owner}/${repo}/${repoInfo.defaultBranch}/${path}`,
          tags: parsed.tags, source: "crawler", repo_updated_at: repoInfo.updatedAt, raw_content: content,
        };
        const flagReasons = scanContentFlags(content);
        if (canAutoPublish({ owner, stars: repoInfo.stars, flagReasons })) {
          await upsertSkill(skillRecord); results.published++;
        } else {
          await insertPendingSkill({ ...skillRecord, flag_reasons: flagReasons }); results.queued++;
        }
      } catch (err) { results.errors++; console.error("[crawl] item", err.message); }
    }
    const pages = { ...(state.pages || {}), [strategy.id]: page + 1 };
    const nextIndex = (strategyIndex + 1) % STRATEGIES.length;
    await setCrawlCursor("code_search", { strategyIndex: nextIndex, page: 1, pages });
    return Response.json(results);
  } catch (err) {
    console.error("[crawl] run failed:", err.message);
    return Response.json({ error: err.message, ...results }, { status: 500 });
  }
}
