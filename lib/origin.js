// lib/origin.js — reject cross-site state-changing requests when Origin is present
export function isAllowedOrigin(request) {
  const origin = request.headers.get("origin");
  // CLI / same-site navigations may omit Origin — allow those.
  if (!origin) return true;
  // Explicitly reject opaque / null origins for state-changing browser posts
  if (origin === "null") return false;

  const site = (process.env.SITE_URL || "").replace(/\/$/, "");
  const allowed = new Set(
    [
      site,
      "https://skillforge-jet-chi.vercel.app",
      "https://skillforge.vercel.app",
    ].filter(Boolean)
  );

  try {
    const u = new URL(origin);
    if (u.protocol !== "https:" && u.hostname !== "localhost") return false;
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return true;
    if (allowed.has(origin.replace(/\/$/, "")) || allowed.has(origin)) return true;
    // Preview deploys: skillforge*.vercel.app only
    if (
      u.hostname.endsWith(".vercel.app") &&
      /^skillforge/i.test(u.hostname.split(".")[0] || "")
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}
