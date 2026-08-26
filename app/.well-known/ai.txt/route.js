const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

/** GEO: machine-oriented AI discovery pointer (geo-optimizer ai_discovery). */
export function GET() {
  const body = `# SkillForge AI discovery
# https://skillforge — agent skill registry

name: SkillForge
description: Public registry of AI agent skills (SKILL.md) indexed from GitHub with safety scanning and one-command install.
url: ${SITE_URL}/
llms_txt: ${SITE_URL}/llms.txt
sitemap: ${SITE_URL}/sitemap.xml
summary_json: ${SITE_URL}/ai/summary
faq_json: ${SITE_URL}/ai/faq
contact: https://github.com/Rustys90/skillforge/issues
source: https://github.com/Rustys90/skillforge
preferred_citation: SkillForge agent skill registry (${SITE_URL}/)
`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
