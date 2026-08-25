// app/api/skills/search/route.js
import { searchSkills } from "../../../../db/queries.js";
import { rateLimit } from "../../../../lib/rate-limit.js";

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
    const { results, total } = await searchSkills({ q, tag, limit, offset });
    return Response.json({ results, count: results.length, total });
  } catch (err) {
    console.error("[api/search] failed:", err.message);
    return Response.json({ error: "search failed" }, { status: 500 });
  }
}
