// app/api/skills/trending/route.js
import { getTrending } from "../../../../db/queries.js";
import { rateLimit } from "../../../../lib/rate-limit.js";

export async function GET(request) {
  const rl = await rateLimit(request, "trending");
  if (!rl.ok) return Response.json({ error: "rate limited" }, { status: 429 });

  const { searchParams } = new URL(request.url);
  const window = searchParams.get("window") || "weekly";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10) || 20, 100);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);

  try {
    const results = await getTrending({ window, limit, offset });
    return Response.json({
      results,
      limit,
      offset,
      hasMore: results.length === limit,
    });
  } catch (err) {
    console.error("[api/trending] failed:", err.message);
    return Response.json({ error: "failed to load trending" }, { status: 500 });
  }
}
