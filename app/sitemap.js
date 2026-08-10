// app/sitemap.js
import { query } from "../db/client.js";

const SITE_URL = process.env.SITE_URL || "https://skillforge.example.com";

export default async function sitemap() {
  const staticRoutes = [
    { url: SITE_URL, lastModified: new Date() },
  ];

  let skillRoutes = [];
  try {
    const { rows } = await query(
      `SELECT owner, repo, path, indexed_at FROM skills WHERE duplicate_of IS NULL LIMIT 5000`
    );
    skillRoutes = rows.map((s) => ({
      url: `${SITE_URL}/skills/${s.owner}/${s.repo}/${s.path}`,
      lastModified: s.indexed_at,
    }));
  } catch (err) {
    console.error("[sitemap] failed to load skills:", err.message);
  }

  return [...staticRoutes, ...skillRoutes];
}
