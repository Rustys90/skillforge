import Link from "next/link";

const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

export const metadata = {
  title: "Trust & safety — SkillForge",
  description:
    "How SkillForge safety-scans agent skills, labels live vs estimated install metrics, runs review queues, and keeps admin APIs off public indexes. Built for honest rankings.",
  alternates: { canonical: `${SITE_URL}/trust` },
  openGraph: {
    title: "Trust & safety | SkillForge",
    description:
      "Safety scanning, trusted publishers, live vs estimated metrics, and how to report problematic skills.",
    url: `${SITE_URL}/trust`,
  },
};

export default function TrustPage() {
  return (
    <main className="min-h-screen bg-space px-6 py-16 text-cream">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-[10px] uppercase tracking-wide text-neon">
          <Link href="/" className="hover:underline">
            Home
          </Link>{" "}/ Trust
        </p>
        <h1 className="mt-3 font-grotesk text-[32px] uppercase leading-tight sm:text-[44px]">
          Trust &amp; safety
        </h1>
        <div className="font-body mt-6 space-y-4 text-[15px] leading-relaxed text-cream/75">
          <p>
            SkillForge is a public registry of AI agent skills (SKILL.md packages) discovered on GitHub. We treat
            every skill as untrusted until automated checks run. The goal is transparency: clear labels, visible
            upstream links, and no silent promotion of blocked content.
          </p>
          <h2 className="font-grotesk pt-2 text-base uppercase text-cream">What we scan for</h2>
          <p>
            Automated checks look for command-injection patterns, sensitive path access, persistence mechanisms,
            reverse shells, destructive filesystem commands, and insecure install pipelines. Findings are grouped by
            severity so operators can prioritize review.
          </p>
          <h2 className="font-grotesk pt-2 text-base uppercase text-cream">Publish policy</h2>
          <p>
            <strong className="text-cream">Block</strong> severity prevents auto-publish.{" "}
            <strong className="text-cream">Review</strong> severity may still publish when the repository is highly
            starred or the owner is on the trusted publishers list. A green UI badge is not a formal security audit—
            teams should still read upstream code before production use.
          </p>
          <h2 className="font-grotesk pt-2 text-base uppercase text-cream">Metrics honesty</h2>
          <p>
            Install metrics distinguish <strong className="text-cream">live</strong> CLI-reported installs from{" "}
            <strong className="text-cream">estimated</strong> figures derived from stars when real volume is low.
            Estimates are labeled in the UI so daily, weekly, and hot rankings stay understandable rather than
            inventing false precision.
          </p>
          <h2 className="font-grotesk pt-2 text-base uppercase text-cream">What stays private</h2>
          <p>
            Admin review tools, cron triggers, and internal APIs are disallowed in robots.txt and are not part of the
            public catalog experience. Crawl jobs require a shared secret header.
          </p>
          <h2 className="font-grotesk pt-2 text-base uppercase text-cream">Report a problem</h2>
          <p>
            Report a problematic skill via{" "}
            <a className="text-neon hover:underline" href="https://github.com/Rustys90/skillforge/issues">
              GitHub issues
            </a>
            . See also{" "}
            <Link href="/acceptable-use" className="text-neon hover:underline">
              Acceptable Use
            </Link>
            ,{" "}
            <Link href="/privacy" className="text-neon hover:underline">
              Privacy
            </Link>
            , and{" "}
            <Link href="/terms" className="text-neon hover:underline">
              Terms
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
