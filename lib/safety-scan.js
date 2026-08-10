// lib/safety-scan.js
// Static pattern scanning for SKILL.md content before it goes live.
// This is risk reduction, not a guarantee — see /app/safety for the public-facing
// explanation of what this does and does not catch.

const PATTERNS = [
  { name: "eval_usage", re: /\beval\s*\(/i },
  { name: "shell_pipe_to_sh", re: /curl\s+[^\n]*\|\s*(sh|bash)\b/i },
  { name: "wget_pipe_to_sh", re: /wget\s+[^\n]*\|\s*(sh|bash)\b/i },
  { name: "rm_rf", re: /\brm\s+-rf\s+[\/~]/i },
  { name: "reverse_shell_hint", re: /\/dev\/tcp\/|nc\s+-e\s+/i },
  { name: "obfuscated_base64_blob", re: /[A-Za-z0-9+\/]{300,}={0,2}/ },
  { name: "env_exfil_hint", re: /process\.env\s*\[.*\]\s*.*fetch\(|process\.env\..*fetch\(/is },
  { name: "credential_pattern", re: /(api[_-]?key|secret[_-]?key|password)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/i },
];

const TRUSTED_OWNERS = (process.env.TRUSTED_OWNERS || "anthropics")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const AUTO_PUBLISH_STAR_THRESHOLD = parseInt(process.env.AUTO_PUBLISH_STAR_THRESHOLD || "500", 10);

/**
 * Scan skill content (and any adjacent file contents passed in `siblingContents`)
 * for suspicious patterns. Returns a list of flag reason strings — empty means clean.
 */
export function scanContent(mainContent, siblingContents = []) {
  const flags = new Set();
  const allText = [mainContent, ...siblingContents].join("\n");

  for (const { name, re } of PATTERNS) {
    if (re.test(allText)) flags.add(name);
  }

  return Array.from(flags);
}

/**
 * Decide whether a skill can skip the review queue and auto-publish.
 * Trusted owners or high-star repos with zero flags go straight through;
 * everything else lands in pending_skills for manual approval.
 */
export function canAutoPublish({ owner, stars, flagReasons }) {
  if (flagReasons.length > 0) return false;
  if (TRUSTED_OWNERS.includes(owner.toLowerCase())) return true;
  if (stars >= AUTO_PUBLISH_STAR_THRESHOLD) return true;
  return false;
}
