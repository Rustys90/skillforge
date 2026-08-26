const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

export const dynamic = "force-static";
export const revalidate = 3600;

/** Structured FAQ for answer engines. */
export function GET() {
  const payload = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: `${SITE_URL}/faq`,
    mainEntity: [
      {
        "@type": "Question",
        name: "What is SkillForge?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "SkillForge is a public registry of AI agent skills (SKILL.md) indexed from GitHub. You can search, open full skill pages, and install with npx skillforge add.",
        },
      },
      {
        "@type": "Question",
        name: "How do I install an agent skill from SkillForge?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Open a skill page and run the install command shown, typically: npx skillforge add owner/repo/skill. Review upstream GitHub source before production use.",
        },
      },
      {
        "@type": "Question",
        name: "Are skills safety-scanned?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Skills are scanned for risky patterns before publish. Block-severity findings are not auto-published. Review-severity may publish for high-star or trusted publishers. Labels are not a full security audit.",
        },
      },
      {
        "@type": "Question",
        name: "What do live vs estimated metrics mean?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Live metrics come from CLI install events when volume is meaningful. Otherwise SkillForge shows estimated figures derived from repository stars and labels them as estimated.",
        },
      },
      {
        "@type": "Question",
        name: "Where is the AI-oriented site map?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `See ${SITE_URL}/llms.txt and ${SITE_URL}/.well-known/ai.txt for machine-readable orientation.`,
        },
      },
    ],
  };

  return Response.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
