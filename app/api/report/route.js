// app/api/report/route.js
import { reportSkill } from "../../../db/queries.js";
import { rateLimit } from "../../../lib/rate-limit.js";

export async function POST(request) {
  const rl = await rateLimit(request, "report");
  if (!rl.ok) return Response.json({ error: "rate limited" }, { status: 429 });

  const body = await request.json().catch(() => ({}));
  const owner = String(body.owner || "").trim().slice(0, 100);
  const repo = String(body.repo || "").trim().slice(0, 100);
  const path = String(body.path || "").trim().slice(0, 400);

  if (!owner || !repo || !path) {
    return Response.json({ error: "owner, repo, and path are required" }, { status: 400 });
  }
  // Basic injection / path traversal guard
  if (/[<>\0]/.test(owner + repo) || path.includes("..")) {
    return Response.json({ error: "invalid input" }, { status: 400 });
  }

  try {
    const ok = await reportSkill(owner, repo, path);
    if (!ok) return Response.json({ error: "skill not found" }, { status: 404 });
    return Response.json({ status: "reported", note: "This skill has been pulled for re-review." });
  } catch (err) {
    console.error("[api/report] failed:", err.message);
    return Response.json({ error: "report failed" }, { status: 500 });
  }
}
