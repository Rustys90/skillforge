// app/api/skills/track-install/route.js
// Hit by the CLI after a successful `skillforge add`, so "trending" reflects
// real install activity instead of the old static placeholder counter.

import crypto from "node:crypto";
import { recordInstall } from "../../../../db/queries.js";
import { rateLimit } from "../../../../lib/rate-limit.js";

export async function POST(request) {
  const rl = await rateLimit(request, "track-install");
  if (!rl.ok) return Response.json({ error: "rate limited" }, { status: 429 });

  const body = await request.json().catch(() => ({}));
  const { owner, repo, path } = body;

  if (!owner || !repo || !path) {
    return Response.json({ error: "owner, repo, and path are required" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);

  try {
    const ok = await recordInstall(owner, repo, path, ipHash);
    if (!ok) return Response.json({ error: "skill not found" }, { status: 404 });
    return Response.json({ status: "recorded" });
  } catch (err) {
    console.error("[api/track-install] failed:", err.message);
    return Response.json({ error: "failed to record install" }, { status: 500 });
  }
}
