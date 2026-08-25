// lib/rate-limit.js
// Cascade: Upstash Redis → Postgres → in-memory Map
// Postgres path is cross-instance safe on Vercel without Redis.

import { query } from "../db/client.js";

const WINDOW_MS = 60_000;

const ROUTE_LIMITS = {
  default: 45,
  search: 30,
  trending: 30,
  detail: 30,
  meta: 20,
  "track-install": 8,
  report: 4,
  "admin-login": 5,
  admin: 20,
  crawl: 6,
};

const memoryBuckets = new Map();
let tableReady = false;
let tableFailed = false;

function clientIp(request) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function maxFor(route) {
  return ROUTE_LIMITS[route] ?? ROUTE_LIMITS.default;
}

async function ensureTable() {
  if (tableReady || tableFailed) return tableReady;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        bucket_key TEXT PRIMARY KEY,
        count      INTEGER NOT NULL DEFAULT 0,
        reset_at   TIMESTAMPTZ NOT NULL
      )
    `);
    tableReady = true;
  } catch (err) {
    console.error("[rate-limit] table init failed:", err.message);
    tableFailed = true;
  }
  return tableReady;
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

    return { ok: count <= max, remaining: Math.max(0, max - count), backend: "redis" };
  } catch {
    return null;
  }
}

async function pgLimit(bucketKey, max) {
  if (!(await ensureTable())) return null;
  const now = new Date();
  const resetAt = new Date(now.getTime() + WINDOW_MS);

  try {
    // Atomic upsert with window reset
    const { rows } = await query(
      `
      INSERT INTO rate_limits (bucket_key, count, reset_at)
      VALUES ($1, 1, $2)
      ON CONFLICT (bucket_key) DO UPDATE
      SET
        count = CASE
          WHEN rate_limits.reset_at <= now() THEN 1
          ELSE rate_limits.count + 1
        END,
        reset_at = CASE
          WHEN rate_limits.reset_at <= now() THEN $2
          ELSE rate_limits.reset_at
        END
      RETURNING count
      `,
      [bucketKey, resetAt.toISOString()]
    );
    const count = Number(rows[0]?.count || 1);
    return { ok: count <= max, remaining: Math.max(0, max - count), backend: "postgres" };
  } catch (err) {
    console.error("[rate-limit] pg failed:", err.message);
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

  if (memoryBuckets.size > 5000) {
    for (const [k, v] of memoryBuckets) {
      if (now > v.resetAt) memoryBuckets.delete(k);
    }
  }

  return {
    ok: entry.count <= max,
    remaining: Math.max(0, max - entry.count),
    backend: "memory",
  };
}

/**
 * @param {Request} request
 * @param {string} [route]
 */
export async function rateLimit(request, route = "default") {
  const ip = clientIp(request);
  const max = maxFor(route);
  const bucketKey = `${route}:${ip}`;

  const redis = await redisLimit(bucketKey, max);
  if (redis) return redis;

  const pg = await pgLimit(bucketKey, max);
  if (pg) return pg;

  return memoryLimit(bucketKey, max);
}
