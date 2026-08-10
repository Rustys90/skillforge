// app/api/skills/search/route.js
import { searchSkills } from "../../../../db/queries.js";
import { rateLimit } from "../../../../lib/rate-limit.js";

export async function GET(request) {
  const rl = await rateLimit(request, "search");
  if (!rl.ok) return Response.json({ error: "rate limited" }, { status: 429 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const tag = searchParams.get("tag") || undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

  try {
    const results = await searchSkills({ q, tag, limit, offset });
    return Response.json({ results, count: results.length });
  } catch (err) {
    console.error("[api/search] failed:", err.message);
    return Response.json({ error: "search failed" }, { status: 500 });
  }
}
