// lib/safety-scan.js
// Regex safety scanner with severity tiers: block | review | info

const CATEGORIES = {
  command_injection: {
    severity: "block",
    patterns: [
      /\$\([^)]*\)/,
      /`[^`]+`/,
      /eval\s*\(/i,
      /exec\s*\(/i,
      /child_process/i,
    ],
  },
  obfuscation: {
    severity: "review",
    patterns: [
      /\x[0-9a-f]{2}(\x[0-9a-f]{2}){10,}/i,
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
      /rm\s+-rf\s+[\/~]/i,
      /mkfs\.|dd\s+if=\/dev\/(zero|random)\s+of=\/dev\//i,
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
      /npm install .*http:\/\//i,
      /pip install .*--index-url\s+http:\/\//i,
      /curl\s+[^
]*\|\s*(sh|bash)/i,
      /wget\s+[^
]*\|\s*(sh|bash)/i,
    ],
  },
};

const TRUSTED_OWNERS = (process.env.TRUSTED_OWNERS || "anthropics")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const AUTO_PUBLISH_STAR_THRESHOLD = parseInt(process.env.AUTO_PUBLISH_STAR_THRESHOLD || "500", 10);

export function scanContent(mainContent, siblingContents = []) {
  const bySeverity = { block: [], review: [], info: [] };
  const flags = [];
  const allText = [mainContent, ...siblingContents].join("
");

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

export function canAutoPublish({ owner, stars, flagReasons }) {
  const flags = flagReasons || [];
  if (flags.length > 0) return false;
  if (TRUSTED_OWNERS.includes(String(owner || "").toLowerCase())) return true;
  if (stars >= AUTO_PUBLISH_STAR_THRESHOLD) return true;
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
