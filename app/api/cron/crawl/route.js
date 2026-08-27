// Multi-strategy discovery + quality refresh.
// Hobby: daily cron. Each run: promote pending → refresh thin → discover new.

import {
  searchSkillFiles,
  getFileContent,
  getRepoInfo,
  throttle,
} from "../../../../lib/github.js";
import {
  parseSkillContent,
  hashContent,
  looksLikeAgentSkill,
} from "../../../../lib/parse-skill.js";
import { scanContentFlags, canAutoPublish } from "../../../../lib/safety-scan.js";
import {
  upsertSkill,
  insertPendingSkill,
  getCrawlCursor,
  setCrawlCursor,
  listPendingForPromote,
  markPendingApproved,
} from "../../../../db/queries.js";
import {
  findSkillByPath,
  isFreshEnough,
  listThinSkills,
  recordCrawlRun,
} from "../../../../db/crawl-helpers.js";
import { updateSkillContent } from "../../../../db/backfill-helpers.js";

export const maxDuration = 60;

const BATCH_SIZE = parseInt(process.env.CRAWL_BATCH_SIZE || "15", 10);
const THIN_REFRESH = parseInt(process.env.CRAWL_THIN_REFRESH || "8", 10);
const STRATEGIES_PER_RUN = parseInt(process.env.CRAWL_STRATEGIES_PER_RUN || "2", 10);
const FRESH_DAYS = parseInt(process.env.CRAWL_FRESH_DAYS || "14", 10);

const STRATEGIES = [
  { id: "priority", query: "stars:>200" },
  { id: "mid_stars", query: "stars:50..200" },
  { id: "sweep", query: "" },
  { id: "path_skills", query: "path:skills" },
  { id: "path_claude", query: "path:.claude" },
  { id: "path_cursor", query: "path:.cursor" },
  { id: "path_codex", query: "path:.codex" },
  { id: "path_agents", query: "path:agents" },
  { id: "size_small", query: "size:<2000" },
  { id: "size_mid", query: "size:2000..10000" },
  { id: "lang_md", query: "language:Markdown" },
];

function authorizedCron(request) {
  const expected = process.env.CRON_SECRET || "";
  if (!expected) return false;
  const header = request.headers.get("x-cron-secret") || "";
  const auth = request.headers.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  return header === expected || bearer === expected;
}

const repoCache = new Map();

async function cachedRepoInfo(owner, repo) {
  const key = `${owner}/${repo}`;
  if (repoCache.has(key)) return repoCache.get(key);
  const info = await getRepoInfo(owner, repo);
  repoCache.set(key, info);
  return info;
}

async function ingestContent(owner, repo, path, content, repoInfo, results) {
  if (!looksLikeAgentSkill(content)) {
    results.rejected_not_skill++;
    return;
  }
  const parsed = parseSkillContent(content, repo, path);
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
    raw_content: content,
  };

  if (canAutoPublish({ owner, stars: repoInfo.stars, flagReasons })) {
    await upsertSkill(skillRecord);
    results.published++;
  } else {
    await insertPendingSkill({ ...skillRecord, flag_reasons: flagReasons });
    results.queued++;
  }
}

async function refreshThin(results) {
  const thin = await listThinSkills(THIN_REFRESH);
  for (const row of thin) {
    try {
      await throttle(900);
      const content = await getFileContent(row.owner, row.repo, row.path);
      if (!content || !looksLikeAgentSkill(content)) {
        results.thin_skipped++;
        continue;
      }
      const parsed = parseSkillContent(content, row.repo, row.path);
      await updateSkillContent(row.id, {
        raw_content: content,
        description: parsed.hasRealDesc ? parsed.description : row.description,
        has_real_desc: parsed.hasRealDesc || row.has_real_desc,
        tags: parsed.tags?.length ? parsed.tags : row.tags,
        content_hash: hashContent(content),
      });
      results.thin_refreshed++;
    } catch (err) {
      results.errors++;
      console.error("[crawl] thin refresh", row.owner, row.repo, row.path, err.message);
    }
  }
}

async function runStrategy(strategy, page, results) {
  const searchRes = await searchSkillFiles({
    query: strategy.query,
    page,
    perPage: BATCH_SIZE,
  });
  const items = searchRes.items || [];
  results.strategies_run.push({ id: strategy.id, page, hits: items.length });

  if (items.length === 0) {
    return { exhausted: true, items: 0 };
  }

  for (const item of items) {
    results.processed++;
    try {
      const owner = item.repository.owner.login;
      const repo = item.repository.name;
      const path = item.path;

      const existing = await findSkillByPath(owner, repo, path);
      if (isFreshEnough(existing, FRESH_DAYS)) {
        results.skipped_fresh++;
        continue;
      }

      await throttle(1100);
      const [content, repoInfo] = await Promise.all([
        getFileContent(owner, repo, path),
        cachedRepoInfo(owner, repo),
      ]);

      if (existing && existing.content_hash === hashContent(content) && Number(existing.body_len) >= 80) {
        results.skipped_unchanged++;
        continue;
      }

      await ingestContent(owner, repo, path, content, repoInfo, results);
      if (existing) results.refreshed++;
    } catch (err) {
      results.errors++;
      console.error("[crawl] item", item.repository?.full_name, item.path, err.message);
    }
  }
  return { exhausted: false, items: items.length };
}

export async function GET(request) {
  if (!authorizedCron(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  const results = {
    processed: 0,
    published: 0,
    queued: 0,
    rejected_not_skill: 0,
    errors: 0,
    promoted: 0,
    thin_refreshed: 0,
    thin_skipped: 0,
    skipped_fresh: 0,
    skipped_unchanged: 0,
    refreshed: 0,
    strategies_run: [],
  };

  try {
    const pending = await listPendingForPromote(50);
    for (const row of pending) {
      if (!canAutoPublish({ owner: row.owner, stars: row.stars, flagReasons: row.flag_reasons || [] })) continue;
      await upsertSkill({ ...row, source: row.source || "crawler", raw_content: row.raw_content || null });
      await markPendingApproved(row.id);
      results.promoted++;
      results.published++;
    }
  } catch (err) {
    console.error("[crawl] promote", err.message);
  }

  try {
    await refreshThin(results);
  } catch (err) {
    console.error("[crawl] thin refresh batch", err.message);
  }

  const state = (await getCrawlCursor("code_search")) || { strategyIndex: 0, pages: {} };
  let strategyIndex = Number(state.strategyIndex) % STRATEGIES.length;
  const pages = { ...(state.pages || {}) };

  try {
    for (let s = 0; s < STRATEGIES_PER_RUN; s++) {
      if (Date.now() - started > 48_000) break;

      const strategy = STRATEGIES[strategyIndex];
      const page = Number(pages[strategy.id] || 1);
      await throttle(1500);
      const { exhausted, items } = await runStrategy(strategy, page, results);

      if (exhausted || items === 0) {
        pages[strategy.id] = 1;
      } else {
        pages[strategy.id] = page + 1;
      }
      strategyIndex = (strategyIndex + 1) % STRATEGIES.length;
    }

    await setCrawlCursor("code_search", { strategyIndex, pages });

    const summary = {
      ...results,
      duration_ms: Date.now() - started,
      next_strategy: STRATEGIES[strategyIndex]?.id,
      at: new Date().toISOString(),
    };
    await recordCrawlRun(summary).catch(() => {});
    return Response.json(summary);
  } catch (err) {
    console.error("[crawl] run failed:", err.message);
    return Response.json(
      { error: err.message, ...results, duration_ms: Date.now() - started },
      { status: 500 }
    );
  }
}

export const POST = GET;
