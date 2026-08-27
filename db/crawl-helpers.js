import { query } from "./client.js";

/** Lookup published skill by owner/repo/path for skip/refresh decisions. */
export async function findSkillByPath(owner, repo, path) {
  const { rows } = await query(
    `SELECT id, content_hash,
            length(coalesce(raw_content, '')) AS body_len,
            has_real_desc, stars, last_crawled_at
     FROM skills
     WHERE owner = $1 AND repo = $2 AND path = $3
     LIMIT 1`,
    [owner, repo, path]
  );
  return rows[0] || null;
}

/**
 * True when we can skip a full re-fetch this run:
 * has a real body, has a real description, and was crawled within `maxAgeDays`.
 */
export function isFreshEnough(row, maxAgeDays = 14) {
  if (!row) return false;
  const bodyOk = Number(row.body_len) >= 80;
  const descOk = Boolean(row.has_real_desc);
  if (!bodyOk || !descOk) return false;
  if (!row.last_crawled_at) return false;
  const ageMs = Date.now() - new Date(row.last_crawled_at).getTime();
  return ageMs < maxAgeDays * 86_400_000;
}

/** Thin published skills for inline refresh during crawl. */
export async function listThinSkills(limit = 10) {
  const { rows } = await query(
    `SELECT id, owner, repo, path, raw_url, content_hash, stars, name, description, tags,
            license_spdx_id, source, repo_updated_at, has_real_desc
     FROM skills
     WHERE raw_content IS NULL
        OR length(coalesce(raw_content, '')) < 80
        OR has_real_desc IS NOT TRUE
     ORDER BY last_crawled_at ASC NULLS FIRST, id ASC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

/** Persist last crawl run summary for admin / debugging. */
export async function recordCrawlRun(summary) {
  await query(
    `INSERT INTO crawl_state (key, value, updated_at)
     VALUES ('last_run', $1::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [JSON.stringify(summary)]
  ).catch(() => {
    // Non-fatal if schema differs
  });
}
