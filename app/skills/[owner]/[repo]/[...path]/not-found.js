import Link from "next/link";

export const metadata = {
  title: "Skill not found",
  robots: { index: false, follow: false },
};

export default function SkillNotFound() {
  return (
    <main className="min-h-screen bg-space px-6 py-16 font-mono text-cream">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-grotesk text-2xl uppercase text-cream">Skill not found</h1>
        <p className="mt-3 text-sm text-cream/60">
          This skill may have been removed, renamed, or is still pending review.
        </p>
        <Link
          href="/#browse"
          className="mt-6 inline-flex rounded-full bg-neon px-5 py-2.5 text-xs uppercase tracking-wide text-space transition hover:opacity-90"
        >
          Browse catalog
        </Link>
      </div>
    </main>
  );
}
