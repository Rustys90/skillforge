const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

export default async function sitemap() {
  const staticRoutes = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/#browse`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/#install`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/#trust`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  let skillRoutes = [];
  try {
    const base = process.env.SKILLFORGE_API_URL || `${SITE_URL}/api`;
    const res = await fetch(`${base.replace(/\/$/, "")}/skills/trending?limit=50&window=weekly`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const results = data.results || [];
      skillRoutes = results
        .filter((s) => s.owner && s.repo && (s.path || s.name))
        .map((s) => {
          const path = (s.path || `skills/${s.name}/SKILL.md`).replace(/^\/+/, "");
          return {
            url: `${SITE_URL}/skills/${s.owner}/${s.repo}/${path}`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
          };
        });
    }
  } catch {
    /* sitemap still valid with static routes */
  }

  return [...staticRoutes, ...skillRoutes];
}
