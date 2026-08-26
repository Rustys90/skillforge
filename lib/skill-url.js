const SITE_URL = process.env.SITE_URL || "https://skillforge-jet-chi.vercel.app";

/** Strip trailing SKILL.md for canonical skill paths. */
export function cleanSkillPath(path) {
  return String(path || "")
    .replace(/^\/+/, "")
    .replace(/\/?SKILL\.md$/i, "");
}

export function skillHref(owner, repo, path) {
  return `/skills/${owner}/${repo}/${cleanSkillPath(path)}`;
}

export function skillAbsoluteUrl(owner, repo, path) {
  return `${SITE_URL}${skillHref(owner, repo, path)}`;
}

export function installCmd(owner, repo, path) {
  const p = cleanSkillPath(path);
  const m = p.match(/^skills\/([^/]+)$/i);
  if (m) return `npx skillforge add ${owner}/${repo}/${m[1]}`;
  return `npx skillforge add ${owner}/${repo}/${p}`;
}
