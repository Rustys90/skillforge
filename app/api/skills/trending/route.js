// app/api/skills/trending/route.js
import { getTrending } from "../../../../db/queries.js";
import { rateLimit } from "../../../../lib/rate-limit.js";
import { qualityScore } from "../../../../lib/skill-rank.js";

export async function GET(request) {
  const rl = await rateLimit(request, "trending");
  if (!rl.ok) return Response.json({ error: "rate limited" }, { status: 429 });

  const { searchParams } = new URL(request.url);
  const window = searchParams.get("window") || "weekly";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10) || 20, 100);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);

  try {
    const results = await getTrending({ window, limit: limit + offset + 30, offset: 0 });
    // Blend existing window scores with path-aware quality so 353k★ mono-repos diverge
    const blended = (results || [])
      .map((s, i) => ({
        ...s,
        _blend: (Number(s.score_hot || s.score_weekly || s.score_daily || 0) || 0) * 0.01 + qualityScore(s) * 10 - i * 0.01,
      }))
      .sort((a, b) => b._blend - a._blend)
      .slice(offset, offset + limit)
      .map(({ _blend, ...rest }) => rest);

    return Response.json({
      results: blended,
      limit,
      offset,
      hasMore: blended.length === limit,
    });
  } catch (err) {
    console.error("[api/trending] failed:", err.message);
    return Response.json({ error: "failed to load trending" }, { status: 500 });
  }
}
