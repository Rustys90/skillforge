import Link from "next/link";
import { notFound } from "next/navigation";
import { getSkillDetail, getRelatedSkills } from "../../../../../db/queries.js";
import { severityFromFlags } from "../../../../../lib/safety-scan.js";
import { enrichSkillWithHf } from "../../../../../lib/hf-downloads.js";
import SkillPageActions from "@/components/SkillPageActions";

export const dynamic = "force-dynamic";

function safeJsonLd(obj) {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}


const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

function skillHref(s) {
  const path = (s.path || "").replace(/\/?SKILL\.md$/i, "");
  return `/skills/${s.owner}/${s.repo}/${path}`;
}

function installCmd(s) {
  const path = (s.path || "").replace(/\/?SKILL\.md$/i, "");
  return `npx skillforge add ${s.owner}/${s.repo}/${path || s.name}`;
}

function cleanPath(path) {
  return String(path || "").replace(/^\/+/, "").replace(/\/?SKILL\.md$/i, "");
}

const SEV_STYLE = {
  clean: { label: "Scanned — clean", className: "text-neon border-neon/40 bg-neon/10" },
  info: { label: "Scanned — info", className: "text-cream/70 border-white/20 bg-white/5" },
  review: { label: "Scanned — review flags", className: "text-amber-300 border-amber-300/40 bg-amber-300/10" },
  block: { label: "Scanned — high risk", className: "text-red-400 border-red-400/40 bg-red-400/10" },
};

export async function generateMetadata({ params }) {
  const { owner, repo, path } = await params;
  const pathStr = Array.isArray(path) ? path.join("/") : path;
  const skill = await getSkillDetail(owner, repo, pathStr).catch(() => null);
  if (!skill) {
    return { title: "Skill not found", robots: { index: false, follow: false } };
  }
  const slug = cleanPath(skill.path);
  const canonical = `${SITE_URL}/skills/${skill.owner}/${skill.repo}/${slug}`;
  let description = skill.description || "";
  if (!description || /pending crawler/i.test(description)) {
    description = `Install ${skill.name} from ${skill.owner}/${skill.repo}. Safety-scanned agent skill on SkillForge.`;
  }
  return {
    title: `${skill.name} — install for your AI agent`,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: `${skill.name} | SkillForge`,
      description,
      siteName: "SkillForge",
    },
    twitter: {
      card: "summary",
      title: `${skill.name} | SkillForge`,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export default async function SkillPage({ params }) {
  const { owner, repo, path } = await params;
  const pathStr = Array.isArray(path) ? path.join("/") : path;
  let skill = await getSkillDetail(owner, repo, pathStr);

  if (!skill) {
    notFound();
  }

  skill = await enrichSkillWithHf(skill);
  const related = await getRelatedSkills(skill.tags || [], skill.id, 4).catch(() => []);
  const sev = severityFromFlags(skill.flag_reasons || []);
  const badge = SEV_STYLE[sev] || SEV_STYLE.clean;
  const cmd = installCmd(skill);
  const slug = cleanPath(skill.path);
  const pageUrl = `${SITE_URL}/skills/${skill.owner}/${skill.repo}/${slug}`;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: skill.owner,
        item: `https://github.com/${skill.owner}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: skill.name,
        item: pageUrl,
      },
    ],
  };


  
  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `Install ${skill.name} agent skill`,
    description: `Install the ${skill.name} skill for your AI coding agent using SkillForge.`,
    step: [
      {
        "@type": "HowToStep",
        name: "Copy the install command",
        text: `Copy: ${cmd}`,
      },
      {
        "@type": "HowToStep",
        name: "Run in your terminal",
        text: "Paste the command in a terminal at your project root and press Enter.",
      },
      {
        "@type": "HowToStep",
        name: "Use the skill in your agent",
        text: "Your agent can now load this skill from the installed path.",
      },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: skill.name,
    description: skill.description || undefined,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    url: pageUrl,
    author: {
      "@type": "Organization",
      name: skill.owner,
      url: `https://github.com/${skill.owner}`,
    },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <main className="relative min-h-screen bg-space text-cream">
      <div className="texture-overlay" aria-hidden />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(howToLd) }}
      />

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-10 sm:px-10 sm:py-16">
        <nav aria-label="Breadcrumb" className="animate-fade-up font-mono text-xs uppercase tracking-wide text-cream/50">
          <Link href="/" className="transition hover:text-neon">
            SkillForge
          </Link>
          <span aria-hidden="true"> / </span>
          <span className="text-cream/80">{skill.name}</span>
        </nav>

        <header className="animate-fade-up mt-8" style={{ animationDelay: "60ms" }}>
          <h1 className="font-grotesk text-4xl uppercase leading-[1.05] tracking-wide text-cream sm:text-5xl md:text-6xl">
            {skill.name}
          </h1>
          <p className="mt-3 font-mono text-xs uppercase tracking-wide text-cream/50">
            {skill.owner}/{skill.repo} · {(skill.stars ?? 0).toLocaleString()}★
          </p>
          <div className="mt-3 flex flex-wrap gap-4 font-mono text-[11px] uppercase tracking-wide text-cream/60">
            <span>
              <span className="text-cream/40">Total </span>
              {(skill.downloads_total ?? skill.downloads ?? 0).toLocaleString()}
            </span>
            <span>
              <span className="text-cream/40">Week </span>
              {(skill.downloads_weekly ?? 0).toLocaleString()}
            </span>
            <span>
              <span className="text-cream/40">Day </span>
              {(skill.downloads_daily ?? 0).toLocaleString()}
            </span>
            {skill.hf_downloads != null && (
              <span title={skill.hf_model_id || "Hugging Face"}>
                <span className="text-cream/40">HF </span>
                {Number(skill.hf_downloads).toLocaleString()}
                {skill.hf_url && (
                  <>
                    {" "}
                    <a
                      href={skill.hf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neon hover:underline"
                    >
                      ↗
                    </a>
                  </>
                )}
              </span>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wide ${badge.className}`}
            >
              {badge.label}
            </span>
            {!skill.has_real_desc && (
              <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 font-mono text-[10px] uppercase text-amber-200">
                Description generated
              </span>
            )}
            {skill.license_spdx_id && (
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase text-cream/60">
                {skill.license_spdx_id}
              </span>
            )}
          </div>
        </header>

        <p
          className="animate-fade-up mt-8 font-mono text-sm leading-relaxed text-cream/80 sm:text-base"
          style={{ animationDelay: "120ms" }}
        >
          {skill.description || "No description available."}
        </p>

        {skill.tags?.length > 0 && (
          <div
            className="animate-fade-up mt-6 flex flex-wrap gap-2"
            style={{ animationDelay: "160ms" }}
          >
            {skill.tags.map((t) => (
              <Link
                key={t}
                href={`/?tag=${encodeURIComponent(t)}`}
                className="rounded-full border border-neon/40 bg-neon/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-neon transition hover:bg-neon/20"
              >
                {t}
              </Link>
            ))}
          </div>
        )}

        <div
          className="liquid-glass animate-fade-up mt-10 rounded-[1.5rem] p-5 sm:p-6"
          style={{ animationDelay: "200ms" }}
        >
          <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-neon">
            Install
          </div>
          <code className="break-all font-mono text-sm text-cream/90 sm:text-base">{cmd}</code>
          <SkillPageActions installCmd={cmd} shareUrl={pageUrl} skillName={skill.name} />
        </div>

        <div
          className="animate-fade-up mt-6 flex flex-wrap gap-3"
          style={{ animationDelay: "240ms" }}
        >
          <a
            href={`https://github.com/${skill.owner}/${skill.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="pressable liquid-glass inline-flex items-center rounded-full px-5 py-2.5 font-mono text-xs uppercase tracking-wide text-cream transition hover:bg-white/10"
          >
            View source →
          </a>
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-neon px-5 py-2.5 font-grotesk text-sm uppercase tracking-wide text-space transition hover:opacity-90"
          >
            Browse more
          </Link>
        </div>

        {skill.flag_reasons?.length > 0 && (
          <section
            className="animate-fade-up mt-10 rounded-[1.25rem] border border-amber-300/30 bg-amber-300/5 p-5 sm:p-6"
            style={{ animationDelay: "260ms" }}
            aria-labelledby="safety-notes-heading"
          >
            <p
              id="safety-notes-heading"
              className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-300"
            >
              Safety notes
            </p>
            <ul className="mt-3 space-y-1.5 font-mono text-xs leading-relaxed text-cream/70">
              {skill.flag_reasons.map((reason, i) => (
                <li key={i}>· {reason}</li>
              ))}
            </ul>
          </section>
        )}

        {skill.raw_content && (
          <section
            className="animate-fade-up mt-10 border-t border-white/10 pt-10"
            style={{ animationDelay: "280ms" }}
            aria-labelledby="skill-md-heading"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neon">Full details</p>
            <h2
              id="skill-md-heading"
              className="mt-2 font-grotesk text-xl uppercase tracking-wide text-cream sm:text-2xl"
            >
              SKILL.md
            </h2>
            <pre className="liquid-glass mt-5 max-h-[36rem] overflow-auto whitespace-pre-wrap rounded-[1.25rem] p-5 font-mono text-xs leading-relaxed text-cream/80 sm:text-sm">
              {skill.raw_content}
            </pre>
          </section>
        )}

        {related.length > 0 && (
          <section
            className="animate-fade-up mt-16 border-t border-white/10 pt-12"
            style={{ animationDelay: "280ms" }}
            aria-labelledby="related-heading"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neon">More like this</p>
            <h2
              id="related-heading"
              className="mt-2 font-grotesk text-2xl uppercase tracking-wide text-cream sm:text-3xl"
            >
              Related skills
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={skillHref(r)}
                    className="liquid-glass group flex items-center justify-between rounded-[1.25rem] px-5 py-4 transition hover:bg-white/10"
                  >
                    <span>
                      <span className="block font-grotesk text-sm uppercase tracking-wide text-cream group-hover:text-neon">
                        {r.name}
                      </span>
                      <span className="mt-0.5 block font-mono text-[10px] uppercase text-cream/40">
                        {r.owner}/{r.repo}
                      </span>
                    </span>
                    <span className="font-mono text-xs text-cream/50">{r.stars}★</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
