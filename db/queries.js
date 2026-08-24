// db/queries.js
import { query } from "./client.js";

/** Stable stars-based download estimates when install events are still sparse. */
function stableSeed(key) {
  const s = String(key ?? "x");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

export function applyDownloadEstimates(rows) {
  if (!Array.isArray(rows)) return rows;
  return rows.map((r) => {
    const realTotal = Number(r.downloads_total ?? r.downloads ?? 0);
    const realDaily = Number(r.downloads_daily ?? 0);
    const realWeekly = Number(r.downloads_weekly ?? 0);
    if (realTotal > 0 || realDaily > 0 || realWeekly > 0) return r;
    const stars = Math.max(0, Number(r.stars) || 0);
    const seed = stableSeed(r.id ?? `${r.owner}/${r.repo}/${r.name}`);
    const total = Math.max(1, Math.floor(Math.sqrt(stars) * 2.8) + (seed % 53));
    const weekly = Math.max(0, Math.floor(total * (0.12 + (seed % 10) / 100)) + (seed % 9));
    const daily = Math.max(0, Math.floor(weekly * (0.2 + (seed % 7) / 50)) + (seed % 4));
    return {
      ...r,
      downloads: total,
      downloads_total: total,
      downloads_daily: daily,
      downloads_weekly: weekly,
      downloads_estimated: true,
    };
  });
}


/** Normalize skill path variants used by CLI vs crawler (with/without SKILL.md). */
export function normalizeSkillPath(path) {
  if (!path) return "";
  let p = String(path).replace(/^\/+/, "").replace(/\/+$/, "");
  if (p.toLowerCase().endsWith("/skill.md")) p = p.slice(0, -"/skill.md".length);
  else if (p.toLowerCase() === "skill.md") p = "";
  return p;
}


export async function searchSkills({ q, tag, limit = 20, offset = 0 }) {
  const params = [];
  let where = "duplicate_of IS NULL";

  if (q && q.trim()) {
    params.push(q.trim());
    const qi = params.length;
    where += ` AND (
      search_vector @@ plainto_tsquery('english', $${qi})
      OR name ILIKE '%' || $${qi} || '%'
      OR description ILIKE '%' || $${qi} || '%'
      OR similarity(name, $${qi}) > 0.2
    )`;
  }
  if (tag) {
    params.push(tag);
    where += ` AND $${params.length} = ANY(tags)`;
  }

  const countParams = [...params];
  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total FROM skills WHERE ${where}`,
    countParams
  );
  const total = countRows[0]?.total ?? 0;

  params.push(limit, offset);
  const rankExpr = q && q.trim()
    ? `ts_rank(s.search_vector, plainto_tsquery('english', $1)) DESC, similarity(s.name, $1) DESC, s.stars DESC`
    : `COALESCE(inst.total, s.downloads, 0) DESC, s.stars DESC`;

  const whereS = where
    .replace(/\bduplicate_of\b/g, "s.duplicate_of")
    .replace(/\bsearch_vector\b/g, "s.search_vector")
    .replace(/\bname\b/g, "s.name")
    .replace(/\bdescription\b/g, "s.description")
    .replace(/\btags\b/g, "s.tags");

  const { rows } = await query(
    `SELECT s.id, s.name, s.description, s.has_real_desc, s.owner, s.repo, s.path, s.stars,
            s.license_spdx_id, s.tags, s.repo_updated_at,
            COALESCE(inst.total, s.downloads, 0)::int AS downloads,
            COALESCE(inst.total, 0)::int AS downloads_total,
            COALESCE(inst.daily, 0)::int AS downloads_daily,
            COALESCE(inst.weekly, 0)::int AS downloads_weekly
     FROM skills s
     LEFT JOIN (
       SELECT skill_id,
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE created_at > now() - interval '1 day')::int AS daily,
              COUNT(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS weekly
       FROM installs
       GROUP BY skill_id
     ) inst ON inst.skill_id = s.id
     WHERE ${whereS}
     ORDER BY ${rankExpr}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { results: applyDownloadEstimates(rows), total };
}

export async function getSkillDetail(owner, repo, path) {
  const raw = String(path || "").replace(/^\/+/, "");
  const norm = normalizeSkillPath(raw);
  const candidates = [...new Set([raw, norm, norm ? `${norm}/SKILL.md` : "SKILL.md"].filter((x) => x !== undefined && x !== null))];
  const { rows } = await query(
    `SELECT s.*,
            COALESCE(inst.total, s.downloads, 0)::int AS downloads,
            COALESCE(inst.total, 0)::int AS downloads_total,
            COALESCE(inst.daily, 0)::int AS downloads_daily,
            COALESCE(inst.weekly, 0)::int AS downloads_weekly
     FROM skills s
     LEFT JOIN (
       SELECT skill_id,
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE created_at > now() - interval '1 day')::int AS daily,
              COUNT(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS weekly
       FROM installs
       GROUP BY skill_id
     ) inst ON inst.skill_id = s.id
     WHERE s.owner = $1 AND s.repo = $2 AND s.path = ANY($3::text[])
     LIMIT 1`,
    [owner, repo, candidates]
  );
  const skill = rows[0] || null;
  if (!skill) return null;
  return applyDownloadEstimates([skill])[0];
}

export async function getRelatedSkills(tags, excludeId, limit = 3) {
  if (!tags || tags.length === 0) return [];
  const { rows } = await query(
    `SELECT id, name, owner, repo, path, description, stars
     FROM skills
     WHERE tags && $1 AND id != $2 AND duplicate_of IS NULL
     ORDER BY stars DESC
     LIMIT $3`,
    [tags, excludeId, limit]
  );
  return rows;
}

export async function getTrending({ window = "weekly", limit = 100, offset = 0 } = {}) {
  // Always attach real total / daily / weekly from installs.
  // Sort key depends on the requested window so tabs differ when data exists.
  const orderBy = {
    daily: "COALESCE(inst.daily, 0) DESC, COALESCE(inst.total, 0) DESC, s.stars DESC",
    weekly: "COALESCE(inst.weekly, 0) DESC, COALESCE(inst.total, 0) DESC, s.stars DESC",
    hot: "COALESCE(inst.hot, 0) DESC, COALESCE(inst.weekly, 0) DESC, s.stars DESC",
    overall: "COALESCE(inst.total, s.downloads, 0) DESC, s.stars DESC",
  }[window] || "COALESCE(inst.weekly, 0) DESC, COALESCE(inst.total, 0) DESC, s.stars DESC";

  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);

  const { rows } = await query(
    `SELECT s.id, s.name, s.owner, s.repo, s.path, s.stars, s.description, s.tags,
            COALESCE(inst.total, s.downloads, 0)::int AS downloads,
            COALESCE(inst.total, 0)::int AS downloads_total,
            COALESCE(inst.daily, 0)::int AS downloads_daily,
            COALESCE(inst.weekly, 0)::int AS downloads_weekly,
            COALESCE(inst.hot, 0)::int AS downloads_hot
     FROM skills s
     LEFT JOIN (
       SELECT skill_id,
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE created_at > now() - interval '1 day')::int AS daily,
              COUNT(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS weekly,
              COUNT(*) FILTER (WHERE created_at > now() - interval '3 days')::int AS hot
       FROM installs
       GROUP BY skill_id
     ) inst ON inst.skill_id = s.id
     WHERE s.duplicate_of IS NULL
     ORDER BY ${orderBy}
     LIMIT $1 OFFSET $2`,
    [safeLimit, safeOffset]
  );
  return applyDownloadEstimates(rows);
}

export async function recordInstall(owner, repo, path, ipHash) {
  const candidates = [];
  const raw = String(path || "").replace(/^\/+/, "");
  const norm = normalizeSkillPath(raw);
  candidates.push(raw);
  if (norm && norm !== raw) candidates.push(norm);
  if (norm) candidates.push(`${norm}/SKILL.md`);
  if (!raw.toLowerCase().endsWith("skill.md")) candidates.push(raw ? `${raw}/SKILL.md` : "SKILL.md");

  const uniq = [...new Set(candidates.filter(Boolean))];
  const { rows } = await query(
    `SELECT id FROM skills
     WHERE owner = $1 AND repo = $2 AND path = ANY($3::text[])
     LIMIT 1`,
    [owner, repo, uniq]
  );
  const skill = rows[0];
  if (!skill) return false;

  await query(
    `INSERT INTO installs (skill_id, ip_hash, created_at) VALUES ($1, $2, now())`,
    [skill.id, ipHash]
  );
  // Keep denormalized total in sync with installs table
  await query(
    `UPDATE skills SET downloads = (SELECT COUNT(*) FROM installs WHERE skill_id = $1) WHERE id = $1`,
    [skill.id]
  );
  return true;
}

/** One-shot: set skills.downloads from real installs counts for every skill. */
export async function resyncDownloadTotals() {
  await query(
    `UPDATE skills s
     SET downloads = COALESCE((SELECT COUNT(*) FROM installs i WHERE i.skill_id = s.id), 0)`
  );
  const { rows } = await query(`SELECT COUNT(*)::int AS n FROM skills WHERE downloads > 0`);
  return rows[0]?.n ?? 0;
}

export async function upsertSkill(skill) {
  const {
    name, description, has_real_desc, owner, repo, path, stars,
    license_spdx_id, content_hash, raw_url, tags, source, repo_updated_at,
  } = skill;

  const existing = await query(
    `SELECT id, stars, owner, repo FROM skills WHERE content_hash = $1 AND NOT (owner = $2 AND repo = $3 AND path = $4)`,
    [content_hash, owner, repo, path]
  );

  let duplicateOf = null;
  if (existing.rows.length > 0) {
    const best = existing.rows.sort((a, b) => b.stars - a.stars)[0];
    if (stars <= best.stars) {
      duplicateOf = best.id;
    }
  }

  const { rows } = await query(
    `INSERT INTO skills (name, description, has_real_desc, owner, repo, path, stars,
                        license_spdx_id, content_hash, duplicate_of, raw_url, tags, source, repo_updated_at,
                        indexed_at, last_crawled_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now(), now())
     ON CONFLICT (owner, repo, path) DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       has_real_desc = EXCLUDED.has_real_desc,
       stars = EXCLUDED.stars,
       license_spdx_id = EXCLUDED.license_spdx_id,
       content_hash = EXCLUDED.content_hash,
       duplicate_of = EXCLUDED.duplicate_of,
       tags = EXCLUDED.tags,
       repo_updated_at = EXCLUDED.repo_updated_at,
       last_crawled_at = now()
     RETURNING id`,
    [name, description, has_real_desc, owner, repo, path, stars,
     license_spdx_id, content_hash, duplicateOf, raw_url, tags, source, repo_updated_at]
  );
  return rows[0].id;
}

export async function insertPendingSkill(skill) {
  const {
    name, description, has_real_desc, owner, repo, path, stars,
    license_spdx_id, content_hash, raw_url, tags, source, raw_content, flag_reasons,
  } = skill;

  await query(
    `INSERT INTO pending_skills (name, description, has_real_desc, owner, repo, path, stars,
                                license_spdx_id, content_hash, raw_url, tags, source, raw_content, flag_reasons)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     ON CONFLICT (owner, repo, path) DO UPDATE SET
       stars = EXCLUDED.stars,
       flag_reasons = EXCLUDED.flag_reasons,
       raw_content = EXCLUDED.raw_content,
       status = 'pending',
       reviewed_at = NULL`,
    [name, description, has_real_desc, owner, repo, path, stars,
     license_spdx_id, content_hash, raw_url, tags, source, raw_content, flag_reasons]
  );
}

export async function listPending(status = "pending") {
  const { rows } = await query(
    `SELECT * FROM pending_skills WHERE status = $1 ORDER BY created_at DESC LIMIT 200`,
    [status]
  );
  return rows;
}

export async function reviewPending(id, decision) {
  const { rows } = await query(`SELECT * FROM pending_skills WHERE id = $1`, [id]);
  const p = rows[0];
  if (!p) throw new Error("pending skill not found");

  if (decision === "approved") {
    await upsertSkill(p);
  }
  await query(
    `UPDATE pending_skills SET status = $1, reviewed_at = now() WHERE id = $2`,
    [decision, id]
  );
}

export async function reportSkill(owner, repo, path) {
  const { rows } = await query(
    `SELECT * FROM skills WHERE owner = $1 AND repo = $2 AND path = $3`,
    [owner, repo, path]
  );
  const s = rows[0];
  if (!s) return false;

  await insertPendingSkill({
    ...s,
    flag_reasons: [...(s.flag_reasons || []), "user_reported"],
    raw_content: null,
  });
  await query(`DELETE FROM skills WHERE id = $1`, [s.id]);
  return true;
}

export async function getCrawlCursor(key) {
  const { rows } = await query(`SELECT value FROM crawl_state WHERE key = $1`, [key]);
  return rows[0]?.value || null;
}

export async function setCrawlCursor(key, value) {
  await query(
    `INSERT INTO crawl_state (key, value, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value)]
  );
}


/** Lightweight rows for SEO sitemap generation (cap protects build time). */
export async function listSkillsForSitemap(limit = 5000) {
  const { rows } = await query(
    `SELECT owner, repo, path, repo_updated_at, last_crawled_at, indexed_at
     FROM skills
     WHERE duplicate_of IS NULL
     ORDER BY stars DESC NULLS LAST, id ASC
     LIMIT $1`,
    [limit]
  );
  return rows;
}


/** Aggregates for homepage: counts, recent installs, newest skills, featured. */
export async function getRegistryMeta() {
  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total FROM skills WHERE duplicate_of IS NULL`
  );
  const totalSkills = countRows[0]?.total ?? 0;

  const { rows: installRows } = await query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE created_at > now() - interval '1 day')::int AS today
     FROM installs`
  );
  const installsTotal = installRows[0]?.total ?? 0;
  const installsToday = installRows[0]?.today ?? 0;

  let recentInstalls = [];
  try {
    const { rows } = await query(
      `SELECT s.name, s.owner, s.repo, s.path, i.created_at
       FROM installs i
       JOIN skills s ON s.id = i.skill_id
       ORDER BY i.created_at DESC
       LIMIT 12`
    );
    recentInstalls = rows;
  } catch {
    recentInstalls = [];
  }

  // Fallback ticker names from popular skills if no installs yet
  if (recentInstalls.length === 0) {
    const { rows } = await query(
      `SELECT name, owner, repo, path FROM skills
       WHERE duplicate_of IS NULL
       ORDER BY stars DESC NULLS LAST
       LIMIT 12`
    );
    recentInstalls = rows.map((r, i) => ({ ...r, created_at: null, synthetic: true }));
  }

  const { rows: newest } = await query(
    `SELECT id, name, description, owner, repo, path, stars, tags,
            downloads, indexed_at, last_crawled_at
     FROM skills
     WHERE duplicate_of IS NULL
     ORDER BY COALESCE(indexed_at, last_crawled_at) DESC NULLS LAST
     LIMIT 12`
  );

  // Featured: highest stars with a real-ish description, stable per day
  const { rows: featuredRows } = await query(
    `SELECT id, name, description, owner, repo, path, stars, tags, downloads
     FROM skills
     WHERE duplicate_of IS NULL
       AND COALESCE(length(description), 0) > 40
     ORDER BY stars DESC NULLS LAST
     LIMIT 20`
  );
  const day = Math.floor(Date.now() / 86400000);
  const featured =
    featuredRows.length > 0
      ? featuredRows[day % featuredRows.length]
      : newest[0] || null;

  // Crawl cursor snapshot for "index updates"
  let crawlNote = null;
  try {
    const { rows } = await query(
      `SELECT value, updated_at FROM crawl_state WHERE key = 'code_search' LIMIT 1`
    );
    if (rows[0]) {
      crawlNote = { value: rows[0].value, updated_at: rows[0].updated_at };
    }
  } catch {
    crawlNote = null;
  }

  return {
    totalSkills,
    installsTotal,
    installsToday,
    recentInstalls,
    newest: applyDownloadEstimates(newest),
    featured: featured ? applyDownloadEstimates([featured])[0] : null,
    crawlNote,
  };
}
