// lib/rate-limit.js
// IP throttle with optional Upstash Redis (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN).
// Falls back to in-memory Map when Redis is not configured.

const WINDOW_MS = 60_000;

/** Per-route limits (requests / minute). Stricter on abuse-prone endpoints. */
const ROUTE_LIMITS = {
  default: 60,
  search: 40,
  trending: 40,
  detail: 40,
  "track-install": 15,
  report: 8,
  "admin-login": 8,
  admin: 30,
  crawl: 10,
};

const memoryBuckets = new Map();

function clientIp(request) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function maxFor(route) {
  return ROUTE_LIMITS[route] ?? ROUTE_LIMITS.default;
}

async function redisLimit(bucketKey, max) {
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
      ok: count <= max,
      remaining: Math.max(0, max - count),
    };
  } catch {
    return null;
  }
}

function memoryLimit(bucketKey, max) {
  const now = Date.now();
  let entry = memoryBuckets.get(bucketKey);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
  }
  entry.count += 1;
  memoryBuckets.set(bucketKey, entry);

  // Opportunistic cleanup
  if (memoryBuckets.size > 5000) {
    for (const [k, v] of memoryBuckets) {
      if (now > v.resetAt) memoryBuckets.delete(k);
    }
  }

  return {
    ok: entry.count <= max,
    remaining: Math.max(0, max - entry.count),
  };
}

/**
 * @param {Request} request
 * @param {string} [route]
 * @returns {Promise<{ ok: boolean, remaining: number }>}
 */
export async function rateLimit(request, route = "default") {
  const ip = clientIp(request);
  const max = maxFor(route);
  const bucketKey = `${route}:${ip}`;

  const redis = await redisLimit(bucketKey, max);
  if (redis) return redis;
  return memoryLimit(bucketKey, max);
}
