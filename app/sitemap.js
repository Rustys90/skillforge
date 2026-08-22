import { query } from "../db/client.js";

const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

function cleanPath(path) {
  return String(path || "")
    .replace(/^\/+/, "")
    .replace(/\/?SKILL\.md$/i, "");
}

export default async function sitemap() {
  const now = new Date();
  const staticRoutes = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  let skillRoutes = [];
  try {
    const { rows } = await query(
      `SELECT owner, repo, path, COALESCE(repo_updated_at, indexed_at) AS mod
       FROM skills
       WHERE duplicate_of IS NULL
       ORDER BY stars DESC NULLS LAST
       LIMIT 10000`
    );
    skillRoutes = rows.map((s) => {
      const p = cleanPath(s.path);
      const slug = p ? `${s.owner}/${s.repo}/${p}` : `${s.owner}/${s.repo}`;
      return {
        url: `${SITE_URL}/skills/${slug}`,
        lastModified: s.mod ? new Date(s.mod) : now,
        changeFrequency: "weekly",
        priority: 0.7,
      };
    });
  } catch (err) {
    console.error("[sitemap] failed to load skills:", err.message);
  }

  return [...staticRoutes, ...skillRoutes];
}
