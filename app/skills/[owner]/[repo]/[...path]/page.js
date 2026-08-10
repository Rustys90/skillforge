// app/skills/[owner]/[repo]/[...path]/page.js
import { getSkillDetail, getRelatedSkills } from "../../../../../db/queries.js";

export async function generateMetadata({ params }) {
  const { owner, repo, path } = params;
  const skillPath = Array.isArray(path) ? path.join("/") : path;
  const skill = await getSkillDetail(owner, repo, skillPath).catch(() => null);

  if (!skill) {
    return { title: "Skill not found" };
  }

  const title = `${skill.name} — install for Claude/Cursor agents | SkillForge`;
  return {
    title,
    description: skill.description?.slice(0, 160),
    alternates: { canonical: `/skills/${owner}/${repo}/${skillPath}` },
    openGraph: { title, description: skill.description, type: "article" },
  };
}

export default async function SkillPage({ params }) {
  const { owner, repo, path } = params;
  const skillPath = Array.isArray(path) ? path.join("/") : path;
  const skill = await getSkillDetail(owner, repo, skillPath).catch(() => null);

  if (!skill) {
    return <div style={{ padding: 40, color: "#f5f3ee", background: "#0a0a0b", minHeight: "100vh" }}>Skill not found.</div>;
  }

  const related = await getRelatedSkills(skill.tags, skill.id).catch(() => []);
  const installCmd = `npx skillforge add ${skill.owner}/${skill.repo}/${skillPath.replace(/\/?SKILL\.md$/, "")}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: skill.name,
    description: skill.description,
    codeRepository: `https://github.com/${skill.owner}/${skill.repo}`,
    programmingLanguage: "Markdown",
    license: skill.license_spdx_id || undefined,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0b", color: "#f5f3ee", fontFamily: "Inter, sans-serif", padding: "80px 24px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 300, fontSize: 40 }}>{skill.name}</h1>
        <p style={{ color: "#8a8579", fontFamily: "JetBrains Mono, monospace", fontSize: 13 }}>
          {skill.owner} / {skill.repo}
          {skill.license_spdx_id && <> · {skill.license_spdx_id}</>}
        </p>
        <p style={{ color: "#c9c5bc", lineHeight: 1.7, marginTop: 24 }}>{skill.description}</p>

        <div style={{ border: "1px solid #2a2825", borderRadius: 12, padding: 24, marginTop: 32, background: "#0f0e0c" }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#c9a961", textTransform: "uppercase", letterSpacing: 2 }}>
            Installation
          </div>
          <code style={{ display: "block", marginTop: 16, color: "#e8d5a0", fontFamily: "JetBrains Mono, monospace", wordBreak: "break-all" }}>
            {installCmd}
          </code>
        </div>

        {related.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#c9a961", textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>
              Related skills
            </div>
            {related.map((r) => (
              <a
                key={r.id}
                href={`/skills/${r.owner}/${r.repo}/${r.path}`}
                style={{ display: "block", color: "#f5f3ee", padding: "12px 0", borderTop: "1px solid #1c1b19" }}
              >
                {r.name} <span style={{ color: "#6b6860", fontSize: 12 }}>— {r.owner}/{r.repo}</span>
              </a>
            ))}
          </div>
        )}

        <a href="/" style={{ display: "inline-block", marginTop: 48, color: "#6b6860", fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>
          ← Back to SkillForge
        </a>
      </div>
    </div>
  );
}
