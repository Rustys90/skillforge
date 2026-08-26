import Link from "next/link";

const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

export const metadata = {
  title: "About SkillForge — the agent skill registry",
  description:
    "SkillForge indexes public SKILL.md agent skills from GitHub, safety-scans them, and offers one-command install via npx skillforge add. Learn how the catalog and crawler work.",
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: "About SkillForge",
    description: "Public registry of AI agent skills indexed from GitHub with safety scanning and CLI install.",
    url: `${SITE_URL}/about`,
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-space px-6 py-16 text-cream">
      <article className="mx-auto max-w-2xl">
        <p className="font-mono text-[10px] uppercase tracking-wide text-neon">
          <Link href="/" className="hover:underline">
            Home
          </Link>{" "}/ About
        </p>
        <h1 className="mt-3 font-grotesk text-[32px] uppercase leading-tight sm:text-[44px]">About SkillForge</h1>
        <div className="font-body mt-6 space-y-4 text-[15px] leading-relaxed text-cream/75">
          <p>
            SkillForge is a public registry for <strong className="text-cream">AI agent skills</strong>—SKILL.md
            packages that teach coding agents (Claude Code, Cursor, and similar tools) how to perform concrete tasks.
            Instead of hunting across scattered GitHub repos, you search one catalog, open a skill page, and install
            with a single CLI command.
          </p>
          <h2 className="font-grotesk pt-2 text-base uppercase text-cream">What we index</h2>
          <p>
            Our crawler searches public GitHub for <code className="text-neon">SKILL.md</code> files, parses
            frontmatter and body content, runs a safety pattern scan, and publishes skills that pass auto-publish
            policy. High-risk findings go to a review queue. Canonical skill URLs never include a trailing{" "}
            <code className="text-neon">SKILL.md</code> segment.
          </p>
          <h2 className="font-grotesk pt-2 text-base uppercase text-cream">How install works</h2>
          <p>
            On any skill page, copy the install command and run it locally, for example{" "}
            <code className="text-neon">npx skillforge add owner/repo/skill</code>. The CLI fetches the skill from
            the upstream repository; SkillForge does not host arbitrary binaries.
          </p>
          <h2 className="font-grotesk pt-2 text-base uppercase text-cream">Rankings & metrics</h2>
          <p>
            Browse by overall popularity, daily, weekly, or hot windows. When CLI install volume is meaningful,
            metrics are labeled live; otherwise figures are estimated from repository stars and clearly marked so
            rankings stay honest.
          </p>
          <h2 className="font-grotesk pt-2 text-base uppercase text-cream">Open source</h2>
          <p>
            The SkillForge application is open source under MIT. Contributions and issue reports are welcome on{" "}
            <a className="text-neon hover:underline" href="https://github.com/Rustys90/skillforge">
              GitHub
            </a>
            .
          </p>
          <div className="flex flex-wrap gap-3 pt-4 font-mono text-[11px]">
            <Link href="/trust" className="text-neon hover:underline">
              Trust & safety
            </Link>
            <Link href="/faq" className="text-neon hover:underline">
              FAQ
            </Link>
            <Link href="/categories/pdf" className="text-neon hover:underline">
              PDF skills
            </Link>
            <Link href="/llms.txt" className="text-neon hover:underline">
              llms.txt
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
