import { query } from "./client.js";

/** Skills missing full SKILL.md body — used by backfill cron. */
export async function listSkillsMissingRawContent(limit = 25) {
  const { rows } = await query(
    `SELECT id, owner, repo, path, raw_url, content_hash, stars, name, description, tags,
            license_spdx_id, source, repo_updated_at, has_real_desc
     FROM skills
     WHERE raw_content IS NULL OR length(coalesce(raw_content, '')) < 80
     ORDER BY last_crawled_at ASC NULLS FIRST, id ASC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

/** Update body + description after backfill fetch. */
export async function updateSkillContent(id, { raw_content, description, has_real_desc, tags, content_hash }) {
  await query(
    `UPDATE skills SET
       raw_content = COALESCE($2, raw_content),
       description = COALESCE($3, description),
       has_real_desc = COALESCE($4, has_real_desc),
       tags = COALESCE($5, tags),
       content_hash = COALESCE($6, content_hash),
       last_crawled_at = now()
     WHERE id = $1`,
    [id, raw_content, description, has_real_desc, tags, content_hash]
  );
}
