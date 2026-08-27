// db/queries.js
import { query } from "./client.js";

/** Stable stars-based download estimates when install events are still sparse. */
function stableSeed(key) {
  let h = 2166136261;
  const s = String(key || "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function applyDownloadEstimates(rows) {
  return (rows || []).map((row) => {
    const stars = Math.max(0, Number(row.stars) || 0);
    const realTotal = Number(row.downloads_total) || 0;
    const seed = stableSeed(`${row.owner}/${row.repo}/${row.path || row.name}`);
    const estTotal = Math.max(1, Math.floor(stars * 0.35 + (seed % 40)));
    const total = realTotal > 0 ? realTotal : estTotal;
    const daily = Number(row.downloads_daily) || Math.max(1, Math.floor(total / 30));
    const weekly = Number(row.downloads_weekly) || Math.max(daily, Math.floor(total / 6));
    return {
      ...row,
      downloads: total,
      downloads_total: total,
      downloads_daily: daily,
      downloads_weekly: weekly,
      downloads_hot: Math.max(daily, Math.floor(weekly / 3)),
      downloads_estimated: realTotal <= 0,
    };
  });
}

function normalizeSkillPath(path) {
  return String(path || "")
    .replace(/^\/+/, "")
    .replace(/\/?SKILL\.md$/i, "");
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
    ? `ts_rank(s.search_vector, plainto_tsquery('english', $1)) DESC, similarity(s.name, $1) DESC, (CASE WHEN s.has_real_desc THEN 1 ELSE 0 END) DESC, s.stars DESC`
    : `(CASE WHEN s.has_real_desc THEN 1 ELSE 0 END) DESC, (CASE WHEN length(coalesce(s.raw_content,'')) >= 80 THEN 1 ELSE 0 END) DESC, COALESCE(inst.total, s.downloads, 0) DESC, s.stars DESC`;

  const whereS = where
    .replace(/\bduplicate_of\b/g, "s.duplicate_of")
    .replace(/\bsearch_vector\b/g, "s.search_vector")
    .replace(/\bname\b/g, "s.name")
    .replace(/\bdescription\b/g, "s.description")
    .replace(/\btags\b/g, "s.tags");

  const { rows } = await query(
    `SELECT s.id, s.name, s.description, s.has_real_desc, s.owner, s.repo, s.path, s.stars,
            s.license_spdx_id, s.tags, s.repo_updated_at,
            length(coalesce(s.raw_content, ''))::int AS body_len,
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
