// lib/origin.js — reject cross-site state-changing requests when Origin is present
export function isAllowedOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser / same-origin navigations often omit Origin
  const site = process.env.SITE_URL || "";
  const allowed = new Set(
    [
      site,
      site.replace(/\/$/, ""),
      "https://skillforge-jet-chi.vercel.app",
      "https://skillforge.vercel.app",
    ].filter(Boolean)
  );
  try {
    const u = new URL(origin);
    if (u.hostname.endsWith(".vercel.app") && u.hostname.includes("skillforge")) return true;
  } catch {
    return false;
  }
  return allowed.has(origin);
}
