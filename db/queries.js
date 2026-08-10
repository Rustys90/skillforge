// db/queries.js
import { query } from "./client.js";

export async function searchSkills({ q, tag, limit = 20, offset = 0 }) {
  const params = [];
  let where = "1=1";

  if (q && q.trim()) {
    params.push(q.trim());
    where += ` AND search_vector @@ plainto_tsquery('english', $${params.length})`;
  }
  if (tag) {
    params.push(tag);
    where += ` AND $${params.length} = ANY(tags)`;
  }

  params.push(limit, offset);
  const rankExpr = q && q.trim()
    ? `ts_rank(search_vector, plainto_tsquery('english', $1)) DESC, stars DESC`
    : `stars DESC`;

  const { rows } = await query(
    `SELECT id, name, description, has_real_desc, owner, repo, path, stars,
            license_spdx_id, tags, downloads, repo_updated_at
     FROM skills
     WHERE ${where} AND duplicate_of IS NULL
     ORDER BY ${rankExpr}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

export async function getSkillDetail(owner, repo, path) {
  const { rows } = await query(
    `SELECT * FROM skills WHERE owner = $1 AND repo = $2 AND path = $3 LIMIT 1`,
    [owner, repo, path]
  );
  return rows[0] || null;
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

export async function getTrending({ window = "weekly", limit = 100 } = {}) {
  const { rows } = await query(
    `SELECT id, name, owner, repo, path, stars, downloads
     FROM skills
     WHERE duplicate_of IS NULL
     ORDER BY downloads DESC, stars DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
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
