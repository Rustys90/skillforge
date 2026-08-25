import Link from "next/link";

const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

export const metadata = {
  title: "Trust & safety — SkillForge",
  description:
    "How SkillForge safety-scans agent skills, labels live vs estimated metrics, and handles review queues.",
  alternates: { canonical: `${SITE_URL}/trust` },
};

export default function TrustPage() {
  return (
    <main className="min-h-screen bg-space px-6 py-16 text-cream">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-[10px] uppercase tracking-wide text-neon">
          <Link href="/" className="hover:underline">Home</Link> / Trust
        </p>
        <h1 className="mt-3 font-grotesk text-[32px] uppercase leading-tight sm:text-[44px]">
          Trust &amp; safety
        </h1>
        <div className="font-body mt-6 space-y-4 text-[15px] leading-relaxed text-cream/75">
          <p>
            SkillForge treats public agent skills as untrusted until scanned. Automated checks look for
            command-injection patterns, sensitive path access, persistence mechanisms, reverse shells,
            destructive filesystem commands, and insecure install pipelines.
          </p>
          <p>
            <strong className="text-cream">Block</strong> severity prevents auto-publish.{" "}
            <strong className="text-cream">Review</strong> severity may still publish when the repository is
            highly starred or the owner is on the trusted publishers list. Users should still audit upstream
            code before production use.
          </p>
          <p>
            Install metrics distinguish <strong className="text-cream">live</strong> CLI-reported installs from{" "}
            <strong className="text-cream">estimated</strong> figures derived from stars when real volume is
            low. Estimates are labeled in the UI so rankings remain honest.
          </p>
          <p>
            Report a problematic skill via{" "}
            <a className="text-neon hover:underline" href="https://github.com/Rustys90/skillforge/issues">
              GitHub issues
            </a>
            . See also{" "}
            <Link href="/acceptable-use" className="text-neon hover:underline">
              Acceptable Use
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
