// lib/rate-limit.js
// IP throttle with optional Upstash Redis (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN).
// Falls back to in-memory Map when Redis is not configured.

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const memoryBuckets = new Map();

function clientIp(request) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

async function redisLimit(bucketKey) {
  const base = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!base || !token) return null;

  const key = `rl:${bucketKey}`;
  try {
    const incrRes = await fetch(`${base}/incr/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!incrRes.ok) return null;
    const incrData = await incrRes.json();
    const count = Number(incrData.result ?? incrData);

    if (count === 1) {
      await fetch(`${base}/pexpire/${encodeURIComponent(key)}/${WINDOW_MS}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
    }

    return {
      ok: count <= MAX_REQUESTS,
      remaining: Math.max(0, MAX_REQUESTS - count),
    };
  } catch {
    return null;
  }
}

function memoryLimit(bucketKey) {
  const now = Date.now();
  const entry = memoryBuckets.get(bucketKey) || { count: 0, resetAt: now + WINDOW_MS };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + WINDOW_MS;
  }
  entry.count += 1;
  memoryBuckets.set(bucketKey, entry);
  return {
    ok: entry.count <= MAX_REQUESTS,
    remaining: Math.max(0, MAX_REQUESTS - entry.count),
  };
}

export async function rateLimit(request, key = "default") {
  const ip = clientIp(request);
  const bucketKey = `${key}:${ip}`;
  const redis = await redisLimit(bucketKey);
  if (redis) return redis;
  return memoryLimit(bucketKey);
}
