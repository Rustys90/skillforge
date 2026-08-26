import Link from "next/link";
import { searchSkills } from "../../../db/queries.js";

const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

export const dynamic = "force-dynamic";

/** Per-tag unique copy for programmatic SEO (claude-seo / geo-optimizer content depth). */
const TAG_GUIDES = {
  pdf: {
    summary:
      "PDF agent skills help coding agents extract text, fill forms, merge documents, OCR scans, and generate PDFs from structured data.",
    useCases:
      "Typical use cases include invoice parsing, contract review helpers, report generation, and batch conversion pipelines that agents can run from a terminal or IDE.",
    tips:
      "Prefer skills that document input/output formats and failure modes. Combine with csv or xlsx skills when moving data between spreadsheets and PDF exports.",
  },
  sql: {
    summary:
      "SQL agent skills teach models to write safe queries, migrate schemas, explain plans, and generate fixtures against Postgres, MySQL, and SQLite.",
    useCases:
      "Teams use them for schema reviews, seed scripts, analytics queries, and turning natural-language questions into parameterized SQL.",
    tips:
      "Look for skills that emphasize parameterized queries and migration discipline. Pair with docker or deploy skills when standing up local databases.",
  },
  csv: {
    summary:
      "CSV skills cover parsing, cleaning, joining, and validating tabular files that agents encounter in data pipelines and exports.",
    useCases:
      "Useful for ETL helpers, finance exports, CRM dumps, and transforming spreadsheet downloads into structured JSON for downstream tools.",
    tips:
      "Choose skills that handle encoding, delimiters, and large files explicitly. Cross-link with xlsx and sql categories for full data workflows.",
  },
  xlsx: {
    summary:
      "XLSX agent skills let agents read and write Excel workbooks, formulas, and multi-sheet models without manual UI clicking.",
    useCases:
      "Common for financial models, inventory sheets, client deliverables, and converting workbook tabs into scripts or reports.",
    tips:
      "Prefer skills that preserve formulas and named ranges when needed. Combine with pdf skills for board-ready exports.",
  },
  testing: {
    summary:
      "Testing skills guide agents through unit, integration, and end-to-end tests, including fixtures, mocks, and CI-friendly assertions.",
    useCases:
      "Speed up TDD loops, generate regression suites, and document how to run tests for a given stack (Jest, Vitest, Playwright, Go test, etc.).",
    tips:
      "Skills that include example commands and coverage goals are easier for agents to follow. Pair with security skills for fuzzing-style checks.",
  },
  docker: {
    summary:
      "Docker skills help agents author Dockerfiles, compose stacks, debug containers, and ship reproducible environments.",
    useCases:
      "Local dev environments, CI images, multi-service demos, and packaging agent tools with pinned dependencies.",
    tips:
      "Look for multi-stage builds and security-minded base images. Related hubs: deploy, security, sql.",
  },
  deploy: {
    summary:
      "Deploy skills document shipping apps to platforms like Vercel, AWS, and containers—with checklists agents can execute step by step.",
    useCases:
      "Preview deployments, production rollouts, environment variable hygiene, and post-deploy smoke tests.",
    tips:
      "Prefer skills that separate secrets from config and include rollback notes. Cross-reference docker and security categories.",
  },
  browser: {
    summary:
      "Browser skills enable agents to automate navigation, scraping, form fills, and visual checks with Playwright, Puppeteer, or similar stacks.",
    useCases:
      "QA flows, competitive research, authenticated dashboards, and capturing screenshots for reports.",
    tips:
      "Skills that document rate limits and selectors age better. Combine with testing and security skills for safe automation.",
  },
  git: {
    summary:
      "Git skills teach agents branching, PR hygiene, bisect workflows, and repository maintenance without destructive force-pushes by default.",
    useCases:
      "Code review prep, release tagging, conflict resolution guidance, and monorepo navigation.",
    tips:
      "Favor skills that prefer non-destructive defaults. Pair with security skills for secret-scanning before push.",
  },
  api: {
    summary:
      "API skills help agents design, call, mock, and document HTTP APIs—including OpenAPI, auth headers, and error contracts.",
    useCases:
      "Integration scaffolding, webhook handlers, SDK wrappers, and contract tests against staging endpoints.",
    tips:
      "Prefer skills that show auth patterns and pagination. Related: security, docker, deploy.",
  },
  security: {
    summary:
      "Security skills focus on threat modeling, dependency review, secret hygiene, and safe patterns for agent-executed tooling.",
    useCases:
      "PR security reviews, hardening checklists, and scanning install scripts before they run in CI.",
    tips:
      "Use alongside SkillForge’s own safety scan labels. Never treat a green badge as a full audit.",
  },
};

const RELATED = {
  pdf: ["csv", "xlsx", "docs"],
  sql: ["docker", "api", "deploy"],
  csv: ["xlsx", "pdf", "sql"],
  xlsx: ["csv", "pdf", "sql"],
  testing: ["security", "git", "deploy"],
  docker: ["deploy", "sql", "security"],
  deploy: ["docker", "api", "security"],
  browser: ["testing", "api", "security"],
  git: ["security", "testing", "deploy"],
  api: ["security", "docker", "deploy"],
  security: ["testing", "git", "api"],
};

function guideFor(tag) {
  const g = TAG_GUIDES[tag];
  if (g) return g;
  return {
    summary: `${tag} agent skills are SKILL.md packages that teach AI coding agents how to perform ${tag}-related tasks from public GitHub repositories.`,
    useCases: `Developers use ${tag} skills inside Claude Code, Cursor, and similar agents to standardize workflows, reduce prompt inventiveness, and share repeatable procedures.`,
    tips: `Browse install commands on each skill page, review upstream source on GitHub, and cross-check related categories when building multi-step agent workflows.`,
  };
}

export async function generateMetadata({ params }) {
  const { tag } = await params;
  const t = decodeURIComponent(tag || "").toLowerCase();
  const g = guideFor(t);
  const description = `${g.summary} Browse safety-scanned ${t} skills on SkillForge and install with npx skillforge add.`.
    slice(0, 160);
  return {
    title: `${t} agent skills — SkillForge registry`,
    description,
    alternates: { canonical: `${SITE_URL}/categories/${encodeURIComponent(t)}` },
    openGraph: {
      title: `${t} agent skills | SkillForge`,
      description,
      url: `${SITE_URL}/categories/${encodeURIComponent(t)}`,
      type: "website",
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

  const guide = guideFor(t);
  const related = RELATED[t] || ["pdf", "api", "security"].filter((x) => x !== t);
  const topStars = results.reduce((m, s) => Math.max(m, Number(s.stars) || 0), 0);
  const owners = new Set(results.map((s) => s.owner).filter(Boolean)).size;

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

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${t} agent skills — SkillForge`,
    description: guide.summary,
    url: `${SITE_URL}/categories/${encodeURIComponent(t)}`,
    isPartOf: { "@type": "WebSite", name: "SkillForge", url: SITE_URL },
    about: { "@type": "Thing", name: `${t} agent skills` },
    numberOfItems: total,
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

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What are ${t} agent skills?`,
        acceptedAnswer: { "@type": "Answer", text: guide.summary },
      },
      {
        "@type": "Question",
        name: `How do I install a ${t} skill from SkillForge?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Open a skill page under /skills/{owner}/{repo}/… and run the install command shown, typically: npx skillforge add owner/repo/skill. Always review the upstream GitHub repository before production use.`,
        },
      },
      {
        "@type": "Question",
        name: `How many ${t} skills does SkillForge index?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `This hub currently lists ${total} ${t}-tagged skills from ${owners} distinct GitHub owners. The catalog grows as the public crawler discovers new SKILL.md files.`,
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-space px-6 py-16 text-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, "\\u003c") }}
      />

      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-[10px] uppercase tracking-wide text-neon">
          <Link href="/" className="hover:underline">
            Home
          </Link>{" "}/ Categories / {t}
        </p>
        <h1 className="mt-3 font-grotesk text-[32px] uppercase leading-tight sm:text-[44px]">
          {t} agent skills
        </h1>

        <p className="font-body mt-4 max-w-3xl text-[15px] leading-relaxed text-cream/80">{guide.summary}</p>
        <p className="font-body mt-3 max-w-3xl text-[15px] leading-relaxed text-cream/70">{guide.useCases}</p>
        <p className="font-body mt-3 max-w-3xl text-[15px] leading-relaxed text-cream/70">{guide.tips}</p>

        <div className="mt-6 flex flex-wrap gap-3 font-mono text-[11px] text-cream/60">
          <span className="liquid-glass rounded-full px-3 py-1">{total} indexed</span>
          <span className="liquid-glass rounded-full px-3 py-1">{owners} publishers</span>
          {topStars > 0 && (
            <span className="liquid-glass rounded-full px-3 py-1">top {topStars}★ on GitHub</span>
          )}
        </div>

        <section className="mt-10">
          <h2 className="font-grotesk text-lg uppercase tracking-wide text-cream">Catalog</h2>
          <p className="font-mono mt-1 text-[11px] text-cream/50">
            Safety-scanned public SKILL.md packages. Install commands live on each skill page.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {results.map((s) => {
              const href = `/skills/${s.owner}/${s.repo}/${skillPath(s)}`;
              return (
                <li key={`${s.owner}/${s.repo}/${s.path}`}>
                  <Link
                    href={href}
                    className="liquid-glass block rounded-xl p-4 transition hover:border-neon/30"
                  >
                    <span className="font-grotesk text-sm uppercase text-cream">{s.name}</span>
                    <span className="mt-1 block font-mono text-[10px] text-cream/45">
                      {s.owner}/{s.repo}
                      {s.stars != null ? ` · ${s.stars}★` : ""}
                    </span>
                    {s.description && (
                      <span className="mt-2 block font-body text-[13px] leading-snug text-cream/65 line-clamp-3">
                        {s.description}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          {results.length === 0 && (
            <p className="font-body mt-6 text-sm text-cream/55">
              No skills tagged “{t}” yet. The crawler indexes public GitHub continuously—check back soon or
              browse the{" "}
              <Link href="/" className="text-neon hover:underline">
                full catalog
              </Link>
              .
            </p>
          )}
        </section>

        <section className="mt-12">
          <h2 className="font-grotesk text-lg uppercase tracking-wide text-cream">Related categories</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {related.map((r) => (
              <Link
                key={r}
                href={`/categories/${encodeURIComponent(r)}`}
                className="liquid-glass rounded-full px-3 py-1 font-mono text-[11px] text-neon hover:underline"
              >
                {r}
              </Link>
            ))}
            <Link href="/" className="liquid-glass rounded-full px-3 py-1 font-mono text-[11px] text-cream/60 hover:text-neon">
              all skills
            </Link>
          </div>
        </section>

        <section className="mt-12 border-t border-cream/10 pt-8">
          <h2 className="font-grotesk text-lg uppercase tracking-wide text-cream">FAQ</h2>
          <div className="font-body mt-4 space-y-4 text-[14px] leading-relaxed text-cream/75">
            <div>
              <h3 className="font-mono text-[12px] uppercase text-cream">What are {t} agent skills?</h3>
              <p className="mt-1">{guide.summary}</p>
            </div>
            <div>
              <h3 className="font-mono text-[12px] uppercase text-cream">How do I install one?</h3>
              <p className="mt-1">
                Open any skill page and run the install command (usually{" "}
                <code className="text-neon">npx skillforge add owner/repo/skill</code>). Review upstream source
                before production use.
              </p>
            </div>
            <div>
              <h3 className="font-mono text-[12px] uppercase text-cream">How many are indexed?</h3>
              <p className="mt-1">
                This hub lists <strong className="text-cream">{total}</strong> {t}-tagged skills from{" "}
                <strong className="text-cream">{owners}</strong> publishers. Counts change as the crawler
                discovers new public SKILL.md files.
              </p>
            </div>
          </div>
        </section>

        <p className="font-mono mt-12 text-[11px] text-cream/40">
          <Link href="/trust" className="hover:text-neon">Trust & safety</Link>
          {" · "}
          <Link href="/faq" className="hover:text-neon">FAQ</Link>
          {" · "}
          <Link href="/llms.txt" className="hover:text-neon">llms.txt</Link>
        </p>
      </div>
    </main>
  );
}
