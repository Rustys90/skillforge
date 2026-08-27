// app/api/skills/search/route.js
import { searchSkills } from "../../../../db/queries.js";
import { rateLimit } from "../../../../lib/rate-limit.js";
import { qualityScore } from "../../../../lib/skill-rank.js";

function isPlaceholderDesc(s) {
  const d = String(s?.description || "").toLowerCase();
  return (
    !d ||
    d.includes("description pending") ||
    d.includes("crawler verification") ||
    d.startsWith("a skill named ")
  );
}

export async function GET(request) {
  const rl = await rateLimit(request, "search");
  if (!rl.ok) return Response.json({ error: "rate limited" }, { status: 429 });

  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get("q") || "").slice(0, 120);
  const tagRaw = searchParams.get("tag");
  const tag = tagRaw ? String(tagRaw).slice(0, 40) : undefined;
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1), 50);
  const offset = Math.min(Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0), 5000);

  try {
    const fetchLimit = Math.min(limit + offset + 60, 120);
    const { results: raw, total } = await searchSkills({ q, tag, limit: fetchLimit, offset: 0 });

    const ranked = (raw || [])
      .map((s) => {
        const bodyLen = Number(s.body_len) || (s.raw_content ? String(s.raw_content).length : 0);
        const hasBody = bodyLen >= 80;
        let score = qualityScore(s);
        if (isPlaceholderDesc(s)) score -= 80;
        if (!s.has_real_desc) score -= 40;
        if (!hasBody) score -= 30;
        if (s.has_real_desc && hasBody) score += 25;
        return {
          ...s,
          has_body: hasBody,
          _q: score,
        };
      })
      .sort((a, b) => b._q - a._q)
      .slice(offset, offset + limit)
      .map(({ _q, ...rest }) => rest);

    return Response.json({ results: ranked, count: ranked.length, total });
  } catch (err) {
    console.error("[api/search] failed:", err.message);
    return Response.json({ error: "search failed" }, { status: 500 });
  }
}
