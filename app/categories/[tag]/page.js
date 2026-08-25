import Link from "next/link";
import { searchSkills } from "../../../db/queries.js";

const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { tag } = await params;
  const t = decodeURIComponent(tag || "").toLowerCase();
  return {
    title: `${t} agent skills — SkillForge`,
    description: `Browse ${t} AI agent skills (SKILL.md) indexed from public GitHub. Safety-scanned. Install with one command.`,
    alternates: { canonical: `${SITE_URL}/categories/${encodeURIComponent(t)}` },
    openGraph: {
      title: `${t} agent skills | SkillForge`,
      description: `Catalog of ${t} skills for Claude, Cursor, and coding agents.`,
      url: `${SITE_URL}/categories/${encodeURIComponent(t)}`,
    },
  };
}

function skillPath(s) {
  return String(s.path || "").replace(/^\/+/, "").replace(/\/?SKILL\.md$/i, "");
}

export default async function CategoryPage({ params }) {
  const { tag } = await params;
  const t = decodeURIComponent(tag || "").toLowerCase().slice(0, 40);
  let results = [];
  let total = 0;
  try {
    const data = await searchSkills({ tag: t, limit: 48, offset: 0 });
    results = data.results || [];
    total = data.total ?? results.length;
  } catch {
    results = [];
  }

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Categories", item: `${SITE_URL}/#browse` },
      {
        "@type": "ListItem",
        position: 3,
        name: t,
        item: `${SITE_URL}/categories/${encodeURIComponent(t)}`,
      },
    ],
  };

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${t} agent skills`,
    numberOfItems: results.length,
    itemListElement: results.slice(0, 24).map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.name,
      url: `${SITE_URL}/skills/${s.owner}/${s.repo}/${skillPath(s)}`,
    })),
  };

  return (
    <main className="min-h-screen bg-space px-6 py-16 text-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd).replace(/</g, "\\u003c") }}
      />
      <div className="mx-auto max-w-content">
        <p className="font-mono text-[10px] uppercase tracking-wide text-neon">
          <Link href="/" className="hover:underline">
            Home
          </Link>{" "}
          / categories / {t}
        </p>
        <h1 className="mt-3 font-grotesk text-[32px] uppercase leading-tight text-cream sm:text-[44px]">
          {t} skills
        </h1>
        <p className="font-body mt-4 max-w-2xl text-[15px] leading-relaxed text-cream/70">
          {total.toLocaleString()} AI agent skills tagged <strong className="text-cream">{t}</strong> in the
          SkillForge index. Each skill is a public SKILL.md (and helpers) from GitHub, safety-scanned before
          it surfaces. Install with{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[12px] text-neon">
            npx skillforge add owner/repo/skill
          </code>
          .
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((s) => (
            <Link
              key={s.id || `${s.owner}-${s.name}`}
              href={`/skills/${s.owner}/${s.repo}/${skillPath(s)}`}
              className="liquid-glass block rounded-[var(--radius-bezel)] p-5 transition hover:bg-white/[0.06]"
            >
              <h2 className="font-grotesk text-lg uppercase tracking-wide text-cream">{s.name}</h2>
              <p className="mt-1 font-mono text-[11px] uppercase text-cream/45">
                {s.owner}/{s.repo} · {(s.stars ?? 0).toLocaleString()}★
              </p>
              <p className="font-body mt-3 line-clamp-3 text-[13px] leading-relaxed text-cream/65">
                {s.description || "Open-source agent skill from public GitHub."}
              </p>
            </Link>
          ))}
        </div>
        {results.length === 0 && (
          <p className="mt-10 font-mono text-sm uppercase text-cream/50">
            No skills found for this tag yet. Try the{" "}
            <Link href="/#browse" className="text-neon hover:underline">
              full catalog
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  );
}
