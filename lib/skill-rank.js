/**
 * Ranking helpers — dampen mega-repo star inflation and prefer path-unique keys.
 */

export function effectiveStars(stars) {
  const s = Math.max(0, Number(stars) || 0);
  // log10(353300+10)≈5.55 → modest multiplier vs raw 353300
  return Math.log10(s + 10);
}

/** Display label: keep raw stars but UI can show "repo ★". */
export function formatStarsLabel(stars) {
  const s = Math.max(0, Number(stars) || 0);
  if (s >= 1000) return `${(s / 1000).toFixed(s >= 10000 ? 0 : 1)}k`;
  return String(s);
}

/**
 * Quality score for catalog ordering when installs are sparse.
 * Mixes log-stars, description quality, and body availability.
 */
export function qualityScore(skill) {
  const logS = effectiveStars(skill.stars);
  const hasDesc = skill.has_real_desc ? 25 : 0;
  const hasBody =
    skill.raw_content && String(skill.raw_content).length >= 80 ? 40 : 0;
  const tagBonus = Array.isArray(skill.tags) ? Math.min(15, skill.tags.length * 3) : 0;
  const pathKey = `${skill.owner}/${skill.repo}/${skill.path || skill.name}`;
  let h = 2166136261;
  for (let i = 0; i < pathKey.length; i++) {
    h ^= pathKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const jitter = (h >>> 0) % 20;
  return Math.floor(logS * 50 + hasDesc + hasBody + tagBonus + jitter);
}
