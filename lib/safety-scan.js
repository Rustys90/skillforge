// lib/safety-scan.js
// Static pattern scanning for SKILL.md content before it goes live.
// Organized into 12 threat categories — risk reduction via static analysis,
// not a guarantee. See README.

const CATEGORIES = {
  command_injection: [
    /;\s*(rm|curl|wget|chmod|chown)\s/i,
    /`[^`]*\$\([^)]*\)[^`]*`/,
    /\$\(\s*curl\s/i,
  ],
  data_exfiltration: [
    /process\.env\s*\[.*\]\s*.*fetch\(|process\.env\..*fetch\(/is,
    /(curl|wget|fetch)\s+.*(webhook\.site|requestbin|ngrok\.io|pastebin\.com\/raw)/i,
    /btoa\([^)]*(env|secret|key|token)[^)]*\)/i,
  ],
  credential_harvesting: [
    /(api[_-]?key|secret[_-]?key|password)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/i,
    /\.ssh\/id_rsa|\.aws\/credentials|\.npmrc.*_authToken/i,
    /cat\s+.*\.env\b/i,
  ],
  prompt_injection: [
    /ignore (all )?(previous|prior|above) instructions/i,
    /do not (tell|inform|mention to) the user/i,
    /without (asking|telling|notifying) (permission|the user)/i,
    /system prompt override/i,
  ],
  obfuscation: [
    /[A-Za-z0-9+\/]{300,}={0,2}/,
    /\\x[0-9a-f]{2}(\\x[0-9a-f]{2}){10,}/i,
    /eval\s*\(\s*atob\(/i,
  ],
  sensitive_file_access: [
    /\/etc\/passwd|\/etc\/shadow/i,
    /~\/\.ssh\/|~\/\.aws\/|~\/\.gnupg\//i,
    /\.git-credentials/i,
  ],
  persistence_mechanisms: [
    /crontab\s+-e|>>\s*~?\/?\.bashrc|>>\s*~?\/?\.zshrc/i,
    /systemctl\s+enable|launchctl\s+load/i,
    /New-ScheduledTask|schtasks\s+\/create/i,
  ],
  external_calls_to_raw_ip: [
    /(curl|wget)\s+https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i,
  ],
  reverse_shells: [
    /\/dev\/tcp\/|nc\s+-e\s+|ncat\s+.*-e\s+/i,
    /python\s+-c\s+.*socket\.socket/i,
  ],
  destructive_commands: [
    /\brm\s+-rf\s+[\/~]/i,
    /\bmkfs\.|dd\s+if=\/dev\/(zero|random)\s+of=\/dev\//i,
    /:\(\)\s*\{\s*:\|:&\s*\};:/,
  ],
  social_engineering: [
    /pretend (you are|to be) (the user|an admin|authorized)/i,
    /this is (only |just )?a test.*disregard/i,
  ],
  supply_chain: [
    /npm install .*http:\/\//i,
    /pip install .*--index-url\s+http:\/\//i,
    /curl\s+[^\n]*\|\s*(sh|bash)\b/i,
    /wget\s+[^\n]*\|\s*(sh|bash)\b/i,
  ],
};

const TRUSTED_OWNERS = (process.env.TRUSTED_OWNERS || "anthropics")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const AUTO_PUBLISH_STAR_THRESHOLD = parseInt(process.env.AUTO_PUBLISH_STAR_THRESHOLD || "500", 10);

export function scanContent(mainContent, siblingContents = []) {
  const flags = new Set();
  const allText = [mainContent, ...siblingContents].join("\n");

  for (const [category, patterns] of Object.entries(CATEGORIES)) {
    if (patterns.some((re) => re.test(allText))) {
      flags.add(category);
    }
  }

  return Array.from(flags);
}

export function canAutoPublish({ owner, stars, flagReasons }) {
  if (flagReasons.length > 0) return false;
  if (TRUSTED_OWNERS.includes(owner.toLowerCase())) return true;
  if (stars >= AUTO_PUBLISH_STAR_THRESHOLD) return true;
  return false;
}
