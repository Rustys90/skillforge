import Link from "next/link";
import { getSkillDetail, getRelatedSkills } from "../../../../../db/queries.js";
import { severityFromFlags } from "../../../../../lib/safety-scan.js";

export const dynamic = "force-dynamic";

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
  clean: { label: "Scanned — clean", color: "#6b9b6b" },
  info: { label: "Scanned — info", color: "#8a8579" },
  review: { label: "Scanned — review flags", color: "#c9a961" },
  block: { label: "Scanned — high risk flags", color: "#c66" },
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
  const description =
    skill.description ||
    `Install ${skill.name} from ${skill.owner}/${skill.repo}. Safety-scanned agent skill on SkillForge.`;
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
  const skill = await getSkillDetail(owner, repo, pathStr);

  if (!skill) {
    return (
      <main style={{ padding: 48, background: "#0a0a0b", color: "#f5f3ee", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
        <p>Skill not found.</p>
        <Link href="/" style={{ color: "#c9a961" }}>← Home</Link>
      </main>
    );
  }

  const related = await getRelatedSkills(skill.tags || [], skill.id, 4).catch(() => []);
  const sev = severityFromFlags(skill.flag_reasons || []);
  const badge = SEV_STYLE[sev] || SEV_STYLE.clean;
  const cmd = installCmd(skill);
  const slug = cleanPath(skill.path);
  const pageUrl = `${SITE_URL}/skills/${skill.owner}/${skill.repo}/${slug}`;

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
    <main style={{ padding: "48px 24px", background: "#0a0a0b", color: "#f5f3ee", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: "#6b6860" }}>
          <Link href="/" style={{ color: "#6b6860", textDecoration: "none" }}>SkillForge</Link>
          <span aria-hidden="true"> / </span>
          <span style={{ color: "#c9c5bc" }}>{skill.name}</span>
        </nav>
        <h1 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 36, margin: "16px 0 8px" }}>{skill.name}</h1>
        <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#6b6860" }}>
          {skill.owner}/{skill.repo} · {skill.stars}★ · {(skill.downloads || 0).toLocaleString()} installs
        </p>
        <p style={{ fontSize: 12, color: badge.color, marginTop: 8 }}>{badge.label}</p>
        {!skill.has_real_desc && (
          <p style={{ fontSize: 11, color: "#c9a961", marginTop: 8 }}>Description generated</p>
        )}
        <p style={{ color: "#c9c5bc", lineHeight: 1.6, marginTop: 20 }}>{skill.description}</p>
        {skill.tags?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            {skill.tags.map((t) => (
              <Link key={t} href={`/?tag=${encodeURIComponent(t)}`} style={{ fontSize: 11, color: "#c9a961", border: "1px solid #c9a96140", borderRadius: 999, padding: "4px 10px", textDecoration: "none" }}>
                {t}
              </Link>
            ))}
          </div>
        )}
        <div style={{ marginTop: 28, padding: 16, border: "1px solid #2a2825", borderRadius: 12, background: "#0f0e0c" }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#c9a961", letterSpacing: "0.2em", marginBottom: 8 }}>INSTALL</div>
          <code style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "#e8d5a0", wordBreak: "break-all" }}>{cmd}</code>
        </div>
        <p style={{ marginTop: 20 }}>
          <a href={`https://github.com/${skill.owner}/${skill.repo}`} target="_blank" rel="noopener noreferrer" style={{ color: "#6b6860", fontSize: 12 }}>
            View source repository →
          </a>
        </p>
        {related.length > 0 && (
          <section style={{ marginTop: 40 }} aria-labelledby="related-heading">
            <h2 id="related-heading" style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 22 }}>Related</h2>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {related.map((r) => (
                <li key={r.id} style={{ marginTop: 12 }}>
                  <Link href={skillHref(r)} style={{ color: "#f5f3ee", textDecoration: "none" }}>{r.name}</Link>
                  <span style={{ color: "#6b6860", fontSize: 12 }}> · {r.stars}★</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
