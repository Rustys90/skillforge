// lib/safety-scan.js
// Regex safety scanner with severity tiers: block | review | info
// Note: common shell docs ($(), backticks) are "review", not hard blocks,
// so the crawler can still auto-publish popular/trusted clean skills.

const CATEGORIES = {
  command_injection: {
    severity: "review",
    patterns: [
      /\$\([^)]*\)/,
      /`[^`]+`/,
      /\beval\s*\(/i,
      /\bexec\s*\(/i,
      /child_process/i,
    ],
  },
  obfuscation: {
    severity: "review",
    patterns: [
      /\\x[0-9a-f]{2}(\\x[0-9a-f]{2}){10,}/i,
      /eval\s*\(\s*atob\(/i,
    ],
  },
  sensitive_file_access: {
    severity: "block",
    patterns: [
      /\/etc\/passwd|\/etc\/shadow/i,
      /~\/\.ssh\/|~\/\.aws\/|~\/\.gnupg\//i,
      /\.git-credentials/i,
    ],
  },
  persistence_mechanisms: {
    severity: "block",
    patterns: [
      /crontab\s+-e|>>\s*~?\/?\.bashrc|>>\s*~?\/?\.zshrc/i,
      /systemctl\s+enable|launchctl\s+load/i,
      /New-ScheduledTask|schtasks\s+\/create/i,
    ],
  },
  external_calls_to_raw_ip: {
    severity: "review",
    patterns: [
      /(curl|wget)\s+https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i,
    ],
  },
  reverse_shells: {
    severity: "block",
    patterns: [
      /\/dev\/tcp\/|nc\s+-e\s+|ncat\s+.*-e\s+/i,
      /python\s+-c\s+.*socket\.socket/i,
    ],
  },
  destructive_commands: {
    severity: "block",
    patterns: [
      /\brm\s+-rf\s+[\/~]/i,
      /\bmkfs\.|dd\s+if=\/dev\/(zero|random)\s+of=\/dev\//i,
      /:\(\)\s*\{\s*:\|:&\s*\};:/,
    ],
  },
  social_engineering: {
    severity: "review",
    patterns: [
      /pretend (you are|to be) (the user|an admin|authorized)/i,
      /this is (only |just )?a test.*disregard/i,
    ],
  },
  supply_chain: {
    severity: "block",
    patterns: [
      new RegExp("npm install .*http://", "i"),
      new RegExp("pip install .*--index-url\\s+http://", "i"),
      new RegExp("curl\\s+[^\\n]*\\|\\s*(sh|bash)\\b", "i"),
      new RegExp("wget\\s+[^\\n]*\\|\\s*(sh|bash)\\b", "i"),
    ],
  },
};

const TRUSTED_OWNERS = (process.env.TRUSTED_OWNERS || "anthropics")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const AUTO_PUBLISH_STAR_THRESHOLD = parseInt(process.env.AUTO_PUBLISH_STAR_THRESHOLD || "100", 10);
const CLEAN_STAR_FLOOR = parseInt(process.env.AUTO_PUBLISH_CLEAN_STARS || "25", 10);
const REVIEW_STAR_FLOOR = parseInt(process.env.AUTO_PUBLISH_REVIEW_STARS || "150", 10);

export function scanContent(mainContent, siblingContents = []) {
  const bySeverity = { block: [], review: [], info: [] };
  const flags = [];
  const allText = [mainContent, ...siblingContents].join("\n");

  for (const [category, { severity, patterns }] of Object.entries(CATEGORIES)) {
    if (patterns.some((re) => re.test(allText))) {
      flags.push(category);
      (bySeverity[severity] || bySeverity.review).push(category);
    }
  }

  let severity = "clean";
  if (bySeverity.block.length) severity = "block";
  else if (bySeverity.review.length) severity = "review";
  else if (bySeverity.info.length) severity = "info";

  return { flags, severity, bySeverity };
}

export function scanContentFlags(mainContent, siblingContents = []) {
  return scanContent(mainContent, siblingContents).flags;
}

/**
 * Auto-publish policy:
 * - Never publish "block" severity
 * - Trusted owners always publish (non-block)
 * - High stars (>= threshold) publish (non-block)
 * - Clean + modest stars publish
 * - Review-only flags need higher star floor
 */
export function canAutoPublish({ owner, stars, flagReasons }) {
  const severity = severityFromFlags(flagReasons);
  if (severity === "block") return false;

  const o = String(owner || "").toLowerCase();
  const s = Math.max(0, Number(stars) || 0);

  if (TRUSTED_OWNERS.includes(o)) return true;
  if (s >= AUTO_PUBLISH_STAR_THRESHOLD) return true;
  if (severity === "clean" && s >= CLEAN_STAR_FLOOR) return true;
  if (severity === "review" && s >= REVIEW_STAR_FLOOR) return true;
  return false;
}

export function severityFromFlags(flagReasons = []) {
  if (!flagReasons.length) return "clean";
  for (const f of flagReasons) {
    if (CATEGORIES[f]?.severity === "block") return "block";
  }
  for (const f of flagReasons) {
    if (CATEGORIES[f]?.severity === "review") return "review";
  }
  return "info";
}
