import Link from "next/link";

export function LegalPage({ title, updated, children }) {
  return (
    <main className="relative min-h-screen bg-space text-cream">
      <div className="texture-overlay" aria-hidden />
      <div className="relative z-10 mx-auto max-w-3xl px-6 py-12 sm:px-10 sm:py-16">
        <nav className="font-mono text-[11px] uppercase tracking-wide text-cream/50" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-neon">
            SkillForge
          </Link>
          <span aria-hidden> / </span>
          <span className="text-cream/80">{title}</span>
        </nav>
        <header className="mt-8">
          <h1 className="font-grotesk text-4xl uppercase leading-tight tracking-wide text-cream sm:text-5xl">
            {title}
          </h1>
          {updated && (
            <p className="mt-3 font-mono text-[11px] uppercase tracking-wide text-cream/45">
              Last updated · {updated}
            </p>
          )}
        </header>
        <div className="legal-prose mt-10 space-y-8 font-mono text-[13px] leading-relaxed text-cream/75">
          {children}
        </div>
        <footer className="mt-16 border-t border-white/10 pt-8">
          <ul className="flex flex-wrap gap-4 font-mono text-[11px] uppercase tracking-wide text-cream/50">
            <li>
              <Link href="/privacy" className="hover:text-neon">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-neon">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/acceptable-use" className="hover:text-neon">
                Acceptable use
              </Link>
            </li>
            <li>
              <Link href="/#browse" className="hover:text-neon">
                Catalog
              </Link>
            </li>
          </ul>
          <p className="mt-6 font-mono text-[10px] uppercase leading-relaxed text-cream/35">
            Informational only — not legal advice. Have a qualified attorney review before relying on these
            pages for compliance.
          </p>
        </footer>
      </div>
    </main>
  );
}

export function H({ children }) {
  return <h2 className="font-grotesk text-lg uppercase tracking-wide text-neon">{children}</h2>;
}

export function P({ children }) {
  return <p className="text-cream/75">{children}</p>;
}

export function Ul({ items }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-cream/70">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
