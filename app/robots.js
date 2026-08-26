const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

/**
 * GEO / Agentic SEO: allow citation bots; keep admin & APIs closed.
 */
export default function robots() {
  const disallowPrivate = ["/admin", "/api/", "/api/admin", "/api/cron"];
  const allowPublic = [
    "/",
    "/skills/",
    "/categories/",
    "/about",
    "/faq",
    "/trust",
    "/privacy",
    "/terms",
    "/acceptable-use",
    "/llms.txt",
    "/sitemap.xml",
  ];

  const aiCitationBots = [
    "OAI-SearchBot",
    "ChatGPT-User",
    "PerplexityBot",
    "ClaudeBot",
    "anthropic-ai",
    "Google-Extended",
    "Applebot-Extended",
    "Bytespider",
    "Amazonbot",
    "meta-externalagent",
  ];

  const rules = [
    {
      userAgent: "*",
      allow: "/",
      disallow: disallowPrivate,
    },
    {
      userAgent: "GPTBot",
      allow: allowPublic,
      disallow: disallowPrivate,
    },
    ...aiCitationBots.map((userAgent) => ({
      userAgent,
      allow: allowPublic,
      disallow: disallowPrivate,
    })),
  ];

  return {
    rules,
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL.replace(/^https?:\/\//, ""),
  };
}
