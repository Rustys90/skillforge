// lib/parse-skill.js
import crypto from "node:crypto";

/**
 * Parse name/description from SKILL.md content. Expects YAML-ish frontmatter
 * (--- name: ... description: ... ---) matching the Claude Code skill format.
 * Falls back to the first heading + first paragraph if frontmatter is missing
 * or incomplete, and flags whether the description was real or generated.
 */
export function parseSkillContent(raw, fallbackName) {
  const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---/);
  let name, description;

  if (fmMatch) {
    const fm = fmMatch[1];
    const nameMatch = fm.match(/^name:\s*(.+)$/m);
    const descMatch = fm.match(/^description:\s*(.+)$/m);
    if (nameMatch) name = nameMatch[1].trim().replace(/^["']|["']$/g, "");
    if (descMatch) description = descMatch[1].trim().replace(/^["']|["']$/g, "");
  }

  if (!name) name = fallbackName;

  let hasRealDesc = Boolean(description);
  if (!description) {
    const body = raw.replace(/^---[\s\S]*?---/, "").trim();
    const heading = body.match(/^#\s+(.+)$/m);
    const firstPara = body.split(/\n\s*\n/).find((p) => p.trim() && !p.trim().startsWith("#"));
    if (heading || firstPara) {
      description = [heading?.[1], firstPara?.trim()].filter(Boolean).join(" — ").slice(0, 300);
    } else {
      description = `A skill named ${name}. No description was found in the file's frontmatter or body.`;
    }
    hasRealDesc = false;
  }

  const tagsMatch = fmMatch?.[1].match(/^tags:\s*\[(.+)\]$/m);
  const explicitTags = tagsMatch
    ? tagsMatch[1].split(",").map((t) => t.trim().replace(/^["']|["']$/g, "")).filter(Boolean)
    : [];

  const keywordTags = extractKeywordTags(description);
  const tags = Array.from(new Set([...explicitTags, ...keywordTags])).slice(0, 6);

  return { name, description, hasRealDesc, tags };
}

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "for", "to", "of", "in", "on", "with",
  "this", "that", "is", "are", "your", "you", "it", "as", "by", "from",
]);

function extractKeywordTags(text) {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
  const freq = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([w]) => w);
}

export function hashContent(raw) {
  return crypto.createHash("sha256").update(raw.trim()).digest("hex");
}
