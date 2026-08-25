// app/api/skills/detail/route.js
import { getSkillDetail, getRelatedSkills } from "../../../../db/queries.js";
import { rateLimit } from "../../../../lib/rate-limit.js";
import { enrichSkillWithHf } from "../../../../lib/hf-downloads.js";

export async function GET(request) {
  const rl = await rateLimit(request, "detail");
  if (!rl.ok) return Response.json({ error: "rate limited" }, { status: 429 });

  const { searchParams } = new URL(request.url);
  const owner = String(searchParams.get("owner") || "").trim().slice(0, 100);
  const repo = String(searchParams.get("repo") || "").trim().slice(0, 100);
  const path = String(searchParams.get("path") || "").trim().slice(0, 400);

  if (!owner || !repo) {
    return Response.json({ error: "owner and repo required" }, { status: 400 });
  }
  if (path.includes("..") || /[<>\0]/.test(owner + repo)) {
    return Response.json({ error: "invalid input" }, { status: 400 });
  }
  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) {
    return Response.json({ error: "invalid input" }, { status: 400 });
  }

  try {
    let skill = await getSkillDetail(owner, repo, path);
    if (!skill) {
      return Response.json({ error: "not found" }, { status: 404 });
    }
    skill = await enrichSkillWithHf(skill);
    const related = await getRelatedSkills(skill.tags || [], skill.id, 4).catch(() => []);
    return Response.json({ skill, related });
  } catch (err) {
    console.error("[api/detail] failed:", err.message);
    return Response.json({ error: "failed" }, { status: 500 });
  }
}
