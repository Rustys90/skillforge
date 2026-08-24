import { getRegistryMeta } from "../../../../db/queries.js";
import { rateLimit } from "../../../../lib/rate-limit.js";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const rl = await rateLimit(request, "search");
  if (!rl.ok) return Response.json({ error: "rate limited" }, { status: 429 });

  try {
    const meta = await getRegistryMeta();
    return Response.json(meta, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (err) {
    console.error("[api/meta]", err.message);
    return Response.json({ error: "meta failed" }, { status: 500 });
  }
}
