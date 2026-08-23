import { listSkillsForSitemap } from "../db/queries.js";

const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

export const revalidate = 3600;

export default async function sitemap() {
  const staticRoutes = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
  ];

  let skillRoutes = [];
  try {
    const rows = await listSkillsForSitemap(5000);
    skillRoutes = rows
      .filter((s) => s.owner && s.repo && s.path)
      .map((s) => {
        const path = String(s.path).replace(/^\/+/, "");
        const last =
          s.repo_updated_at || s.updated_at
            ? new Date(s.repo_updated_at || s.updated_at)
            : new Date();
        return {
          url: `${SITE_URL}/skills/${s.owner}/${s.repo}/${path}`,
          lastModified: last,
          changeFrequency: "weekly",
          priority: 0.75,
        };
      });
  } catch (err) {
    console.error("[sitemap] skills list failed:", err.message);
  }

  return [...staticRoutes, ...skillRoutes];
}
