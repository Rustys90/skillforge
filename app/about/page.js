import Link from "next/link";

const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

export const metadata = {
  title: "About SkillForge — the agent skill registry",
  description:
    "SkillForge indexes public AI agent skills (SKILL.md) from GitHub, safety-scans them, ranks by activity, and installs with one npx command.",
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutPage() {
  const aboutLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About SkillForge",
    url: `${SITE_URL}/about`,
    mainEntity: {
      "@type": "Organization",
      name: "SkillForge",
      url: SITE_URL,
      description:
        "Public registry of AI agent skills indexed from GitHub with safety scanning and CLI install.",
    },
  };

  return (
    <main className="min-h-screen bg-space px-6 py-16 text-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(aboutLd).replace(/</g, "\\u003c"),
        }}
      />
      <article className="mx-auto max-w-2xl">
        <p className="font-mono text-[10px] uppercase tracking-wide text-neon">
          <Link href="/" className="hover:underline">
            Home
          </Link>{" "}
          / About
        </p>
        <h1 className="mt-3 font-grotesk text-[32px] uppercase leading-tight sm:text-[44px]">
          About SkillForge
        </h1>
        <div className="font-body mt-6 space-y-4 text-[15px] leading-relaxed text-cream/75">
          <p>
            <strong className="text-cream">SkillForge</strong> is a public registry of AI agent skills. A skill is
            typically a <code className="rounded bg-white/10 px-1 font-mono text-[13px] text-neon">SKILL.md</code>{" "}
            file (and optional helpers) that teaches an agent how to perform a task—working with PDFs, driving a
            browser, shipping with git, querying SQL, and similar workflows.
          </p>
          <p>
            Skills are discovered by crawling public GitHub repositories. Before a skill is auto-published,
            SkillForge runs a pattern-based safety scan for high-risk behaviors such as destructive shell
            commands, sensitive file access, and unsafe install pipelines. Block-severity findings are held for
            review rather than published silently.
          </p>
          <p>
            The catalog supports search, tag filters, and leaderboards (daily, weekly, hot, overall). Install
            activity from the CLI is recorded when available; otherwise rankings may use time-aware estimates
            derived from repository stars, and those estimates are labeled in the interface.
          </p>
          <p>
            Installation is intentionally simple:{" "}
            <code className="rounded bg-white/10 px-1 font-mono text-[13px] text-neon">
              npx skillforge add owner/repo/skill
            </code>
            . Upstream licenses and source remain on GitHub; SkillForge does not re-license third-party skills.
          </p>
          <p>
            Open source:{" "}
            <a
              className="text-neon hover:underline"
              href="https://github.com/Rustys90/skillforge"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/Rustys90/skillforge
            </a>
            .
          </p>
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/#browse" className="rounded-full bg-neon px-4 py-2 font-grotesk text-[11px] uppercase text-space">
            Browse catalog
          </Link>
          <Link href="/faq" className="rounded-full border border-white/15 px-4 py-2 font-mono text-[11px] uppercase text-cream">
            FAQ
          </Link>
          <Link href="/trust" className="rounded-full border border-white/15 px-4 py-2 font-mono text-[11px] uppercase text-cream">
            Trust
          </Link>
        </div>
      </article>
    </main>
  );
}
