import HomeClient from "./HomeClient.jsx";
import { getTrending, getRegistryMeta } from "../db/queries.js";

const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "SkillForge — find the right skill for your agent",
  description:
    "Search and install AI agent skills (SKILL.md) for Claude, Cursor, and coding agents. Indexed from public GitHub, safety-scanned, updated daily.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "SkillForge — the agent skill registry",
    description: "Search and install AI agent skills in one command. Safety-scanned catalog from public GitHub.",
    url: SITE_URL,
    type: "website",
    siteName: "SkillForge",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillForge — the agent skill registry",
    description: "Search and install AI agent skills in one command.",
  },
};

function skillPath(s) {
  return String(s.path || "").replace(/^\/+/, "").replace(/\/?SKILL\.md$/i, "");
}

function skillHref(s) {
  return `${SITE_URL}/skills/${s.owner}/${s.repo}/${skillPath(s)}`;
}

function safeJsonLd(obj) {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export default async function Page() {
  let initialTrending = [];
  let initialWeekly = [];
  let initialMeta = null;

  try {
    const [overall, weekly, meta] = await Promise.all([
      getTrending({ window: "overall", limit: 12 }),
      getTrending({ window: "weekly", limit: 8 }),
      getRegistryMeta(),
    ]);
    initialTrending = overall || [];
    initialWeekly = weekly || [];
    initialMeta = meta;
  } catch (err) {
    console.error("[page] SSR data failed:", err.message);
  }

  // ItemList for AEO/SEO — present in initial HTML
  const itemListLd =
    initialTrending.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Featured agent skills on SkillForge",
          numberOfItems: initialTrending.length,
          itemListElement: initialTrending.slice(0, 12).map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: s.name,
            url: skillHref(s),
            description: (s.description || "").slice(0, 200),
          })),
        }
      : null;

  return (
    <>
      {itemListLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListLd) }}
        />
      )}
      {/* SSR-visible summary for crawlers that skip client JS */}
      <section className="sr-only" aria-hidden="false">
        <h2>Indexed agent skills</h2>
        <p>
          SkillForge indexes {(initialMeta?.totalSkills ?? initialTrending.length).toLocaleString()} public
          AI agent skills (SKILL.md) from GitHub. Safety-scanned. Install with npx skillforge add.
        </p>
        <ul>
          {initialTrending.slice(0, 12).map((s) => (
            <li key={`${s.owner}-${s.repo}-${s.name}`}>
              <a href={skillHref(s).replace(SITE_URL, "")}>
                {s.name} by {s.owner} — {(s.stars ?? 0).toLocaleString()} stars
              </a>
              {(s.description || "").slice(0, 160)}
            </li>
          ))}
        </ul>
      </section>
      <HomeClient
        initialTrending={initialTrending}
        initialWeekly={initialWeekly}
        initialMeta={initialMeta}
      />
    </>
  );
}
