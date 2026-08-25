import { listSkillsForSitemap } from "../db/queries.js";

const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

function skillUrl(s) {
  const path = String(s.path || `skills/${s.name}/SKILL.md`).replace(/^\/+/, "");
  return `${SITE_URL}/skills/${s.owner}/${s.repo}/${path}`;
}

async function skillsFromDb() {
  const rows = await listSkillsForSitemap(5000);
  return rows
    .filter((s) => s.owner && s.repo && s.path)
    .map((s) => ({
      url: skillUrl(s),
      lastModified: s.repo_updated_at || s.last_crawled_at || s.indexed_at ? new Date(s.repo_updated_at || s.last_crawled_at || s.indexed_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.75,
    }));
}

/** Fallback: page public search API if DB import fails in edge/runtime. */
async function skillsFromApi() {
  const out = [];
  let offset = 0;
  const limit = 50;
  for (let page = 0; page < 50; page++) {
    const res = await fetch(
      `${SITE_URL}/api/skills/search?limit=${limit}&offset=${offset}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) break;
    const data = await res.json();
    const results = data.results || [];
    if (!results.length) break;
    for (const s of results) {
      if (s.owner && s.repo) {
        out.push({
          url: skillUrl(s),
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.75,
        });
      }
    }
    offset += limit;
    if (results.length < limit) break;
    if (out.length >= 5000) break;
  }
  return out;
}

export default async function sitemap() {
  const staticRoutes = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/trust`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/acceptable-use`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    // Category hubs (architecture: every category is a topic hub)
    ...["pdf", "browser", "git", "sql", "docker", "deploy", "api", "security", "xlsx", "csv"].map((tag) => ({
      url: `${SITE_URL}/categories/${tag}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.65,
    })),
  ];

  let skillRoutes = [];
  try {
    skillRoutes = await skillsFromDb();
  } catch (err) {
    console.error("[sitemap] db failed:", err.message);
  }

  if (skillRoutes.length === 0) {
    try {
      skillRoutes = await skillsFromApi();
    } catch (err) {
      console.error("[sitemap] api fallback failed:", err.message);
    }
  }

  return [...staticRoutes, ...skillRoutes];
}
