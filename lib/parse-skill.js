// lib/parse-skill.js
import crypto from "node:crypto";

/**
 * Filename match alone isn't enough — plenty of unrelated repos happen to have
 * a file named SKILL.md. Require frontmatter name/description OR strong signals.
 */
export function looksLikeAgentSkill(content) {
  if (!content || typeof content !== "string") return false;
  const sample = content.slice(0, 8000);
  const hasFm = /^---\s*\n[\s\S]*?\n---/.test(sample);
  const hasName = /\bname\s*:\s*["']?[\w.-]+/i.test(sample);
  const hasDesc = /\bdescription\s*:\s*.+/i.test(sample);
  const signals = [
    /\bSKILL\.md\b/i,
    /\bagent\s+skill\b/i,
    /\bclaude\b/i,
    /\bcursor\b/i,
    /\binstall\b/i,
    /\bnpx\b/i,
    /\btools?\s*:/i,
    /\binstructions?\b/i,
  ].filter((re) => re.test(sample)).length;
  if (hasFm && (hasName || hasDesc)) return true;
  if (hasName && hasDesc) return true;
  return signals >= 3;
}

function stripQuotes(s) {
  return String(s || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

function firstParagraph(body) {
  const lines = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("```") && !l.startsWith("|") && !l.startsWith("- ["));
  for (const line of lines) {
    // skip pure metadata noise
    if (/^(name|description|license|author)\s*:/i.test(line)) continue;
    if (line.length >= 40) return line.slice(0, 320);
  }
  return lines[0] ? lines[0].slice(0, 320) : "";
}

/**
 * Extract structured fields from SKILL.md content.
 * Prefer YAML frontmatter; fall back to markdown body.
 */
export function parseSkillContent(content, repoHint = "") {
  const text = String(content || "");
  let name = "";
  let description = "";
  let tags = [];
  let hasRealDesc = false;

  const fm = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (fm) {
    const block = fm[1];
    const nameM = block.match(/^\s*name\s*:\s*(.+)$/im);
    const descM = block.match(/^\s*description\s*:\s*(.+)$/im);
    const tagsM = block.match(/^\s*tags\s*:\s*(.+)$/im);
    if (nameM) name = stripQuotes(nameM[1]);
    if (descM) {
      description = stripQuotes(descM[1]);
      // multi-line YAML description: >
      if ((!description || description === ">" || description === "|") && descM) {
        const after = block.slice(block.toLowerCase().indexOf("description"));
        const multi = after.match(/description\s*:\s*[>|]?\s*\n((?:\s{2,}.+\n?)+)/i);
        if (multi) {
          description = multi[1]
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
            .join(" ")
            .slice(0, 400);
        }
      }
      if (description.length >= 24) hasRealDesc = true;
    }
    if (tagsM) {
      const raw = tagsM[1].trim();
      if (raw.startsWith("[")) {
        tags = raw
          .replace(/[\[\]]/g, "")
          .split(",")
          .map((t) => stripQuotes(t))
          .filter(Boolean)
          .slice(0, 12);
      } else {
        tags = raw.split(/[,\s]+/).map(stripQuotes).filter(Boolean).slice(0, 12);
      }
    }
  }

  const body = fm ? text.slice(fm[0].length) : text;
  if (!name) {
    const h1 = body.match(/^#\s+(.+)$/m);
    if (h1) name = stripQuotes(h1[1]).slice(0, 80);
  }
  if (!description || description.length < 24) {
    const para = firstParagraph(body);
    if (para && para.length >= 24) {
      description = para;
      hasRealDesc = true;
    }
  }

  if (!name) {
    // last resort: repo or path basename — never invent marketing copy
    name = (repoHint || "skill").split("/").pop().replace(/\.md$/i, "") || "skill";
  }

  if (!description) {
    description = `${name} — agent skill from ${repoHint || "GitHub"}. Open the page for full instructions.`;
    hasRealDesc = false;
  }

  // Light tag inference from text
  if (tags.length === 0) {
    const blob = (name + " " + description + " " + body.slice(0, 2000)).toLowerCase();
    const catalog = ["pdf", "xlsx", "csv", "api", "git", "browser", "testing", "deploy", "docker", "sql", "email", "slack", "notion", "security", "docs"];
    tags = catalog.filter((t) => blob.includes(t)).slice(0, 6);
  }

  return { name: name.slice(0, 120), description: description.slice(0, 400), tags, hasRealDesc };
}

export function hashContent(content) {
  return crypto.createHash("sha256").update(String(content || ""), "utf8").digest("hex");
}
