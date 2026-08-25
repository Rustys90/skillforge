// app/api/skills/track-install/route.js
import crypto from "node:crypto";
import { recordInstall } from "../../../../db/queries.js";
import { rateLimit } from "../../../../lib/rate-limit.js";

function sanitizePart(v, max) {
  return String(v || "")
    .trim()
    .slice(0, max)
    .replace(/[<>\0]/g, "");
}

export async function POST(request) {
  const rl = await rateLimit(request, "track-install");
  if (!rl.ok) return Response.json({ error: "rate limited" }, { status: 429 });

  // Cap body size (abuse)
  const cl = request.headers.get("content-length");
  if (cl && Number(cl) > 4096) {
    return Response.json({ error: "payload too large" }, { status: 413 });
  }

  const body = await request.json().catch(() => ({}));
  const owner = sanitizePart(body.owner, 100);
  const repo = sanitizePart(body.repo, 100);
  const path = sanitizePart(body.path, 400);

  if (!owner || !repo || !path) {
    return Response.json({ error: "owner, repo, and path are required" }, { status: 400 });
  }
  if (path.includes("..") || owner.includes("/") || repo.includes("/")) {
    return Response.json({ error: "invalid input" }, { status: 400 });
  }
  // GitHub-like name constraints
  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) {
    return Response.json({ error: "invalid input" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = crypto.createHash("sha256").update(ip + (process.env.CRON_SECRET || "sf")).digest("hex").slice(0, 16);

  try {
    const ok = await recordInstall(owner, repo, path, ipHash);
    if (!ok) return Response.json({ error: "skill not found" }, { status: 404 });
    return Response.json({ status: "recorded" });
  } catch (err) {
    console.error("[api/track-install] failed:", err.message);
    return Response.json({ error: "failed to record install" }, { status: 500 });
  }
}
