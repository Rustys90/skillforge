// app/api/skills/detail/route.js
// Using a query-param route (?owner=&repo=&path=) rather than a nested dynamic
// segment since skill paths can contain slashes — keeps the matching simple.

import { getSkillDetail, getRelatedSkills } from "../../../../db/queries.js";
import { rateLimit } from "../../../../lib/rate-limit.js";

export async function GET(request) {
  const rl = await rateLimit(request, "detail");
  if (!rl.ok) return Response.json({ error: "rate limited" }, { status: 429 });

  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const path = searchParams.get("path");

  if (!owner || !repo || !path) {
    return Response.json({ error: "owner, repo, and path are required" }, { status: 400 });
  }

  try {
    const skill = await getSkillDetail(owner, repo, path);
    if (!skill) return Response.json({ error: "not found" }, { status: 404 });

    const related = await getRelatedSkills(skill.tags, skill.id);
    return Response.json({ skill, related });
  } catch (err) {
    console.error("[api/detail] failed:", err.message);
    return Response.json({ error: "failed to load skill" }, { status: 500 });
  }
}
