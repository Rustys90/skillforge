// lib/rate-limit.js
// Basic in-memory IP throttle. Good enough to stop casual abuse on a single
// serverless instance; note this resets per cold start and isn't shared across
// instances — if traffic grows, swap this for Upstash Redis or Vercel's own
// rate-limit middleware. Documented as a known limitation in the README.

const buckets = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

export async function rateLimit(request, key = "default") {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();

  const entry = buckets.get(bucketKey) || { count: 0, resetAt: now + WINDOW_MS };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + WINDOW_MS;
  }
  entry.count++;
  buckets.set(bucketKey, entry);

  return { ok: entry.count <= MAX_REQUESTS, remaining: Math.max(0, MAX_REQUESTS - entry.count) };
}
