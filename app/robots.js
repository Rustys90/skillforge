const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

/**
 * GEO / Agentic SEO: allow citation bots; keep admin & APIs closed.
 * Ref: Auriti-Labs/geo-optimizer-skill, Bhanunamikaze/Agentic-SEO-Skill
 */
export default function robots() {
  const disallowPrivate = ["/admin", "/api/", "/api/admin", "/api/cron"];
  const allowPublic = ["/", "/skills/", "/privacy", "/terms", "/acceptable-use", "/llms.txt", "/sitemap.xml"];

  const aiCitationBots = [
    "OAI-SearchBot", // ChatGPT Search citations
    "ChatGPT-User",
    "PerplexityBot",
    "ClaudeBot",
    "anthropic-ai",
    "Google-Extended", // Gemini AI Overviews
    "Applebot-Extended",
    "Bytespider",
  ];

  const rules = [
    {
      userAgent: "*",
      allow: "/",
      disallow: disallowPrivate,
    },
    // Training-oriented bots: still allow public catalog pages (product is public index)
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
