import Link from "next/link";

const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

export const metadata = {
  title: "FAQ — SkillForge agent skill registry",
  description:
    "Answers about AI agent skills, SKILL.md, installing with npx skillforge, safety scanning, and rankings.",
  alternates: { canonical: `${SITE_URL}/faq` },
};

const FAQS = [
  {
    q: "What is an AI agent skill?",
    a: "An agent skill is a SKILL.md package (plus optional helpers) that teaches coding agents such as Claude Code or Cursor how to perform a concrete task—for example PDF extraction, git workflows, or API calls. SkillForge indexes these packages from public GitHub.",
  },
  {
    q: "How do I install a skill from SkillForge?",
    a: "Open any skill page, copy the install command, and run it in your project terminal. The standard form is: npx skillforge add owner/repo/skill. Then reload or restart your agent so it can load the skill.",
  },
  {
    q: "Are SkillForge skills safety-scanned?",
    a: "Yes. Content is scanned for high-risk patterns (destructive commands, credential paths, reverse shells, supply-chain install tricks). Block-severity findings are not auto-published. Review-flagged skills may still publish when stars or trusted publishers meet the policy threshold. Always review upstream source before production use.",
  },
  {
    q: "Where do rankings and download numbers come from?",
    a: "Daily, weekly, hot, and overall boards use real install events from the SkillForge CLI when volume is meaningful. Otherwise SkillForge shows time-aware estimates derived from repository stars and labels them estimated. Live vs estimated is always marked in the UI.",
  },
  {
    q: "How does SkillForge discover new skills?",
    a: "A crawler searches public GitHub for SKILL.md files, parses metadata, runs the safety scan, and either publishes or queues the skill. The index is updated on a recurring schedule.",
  },
  {
    q: "Is SkillForge free?",
    a: "Browsing the catalog and installing skills with the CLI is free. Skills themselves remain under the licenses of their upstream GitHub repositories.",
  },
];

export default function FaqPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main className="min-h-screen bg-space px-6 py-16 text-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-[10px] uppercase tracking-wide text-neon">
          <Link href="/" className="hover:underline">
            Home
          </Link>{" "}
          / FAQ
        </p>
        <h1 className="mt-3 font-grotesk text-[32px] uppercase leading-tight sm:text-[44px]">FAQ</h1>
        <p className="font-body mt-4 text-[15px] leading-relaxed text-cream/65">
          Direct answers for developers installing agent skills for the first time. Updated for the SkillForge
          public registry.
        </p>
        <div className="mt-10 space-y-8">
          {FAQS.map((f) => (
            <article key={f.q}>
              <h2 className="font-ui text-base font-semibold uppercase tracking-wide text-cream">{f.q}</h2>
              <p className="font-body mt-2 text-[15px] leading-relaxed text-cream/70">{f.a}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
