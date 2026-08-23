// db/client.js
// Single shared pg Pool. Import { query } wherever DB access is needed.

import { Pool } from "pg";

let pool;

function sslConfig(connectionString) {
  if (/localhost|127\.0\.0\.1/.test(connectionString)) return undefined;
  // Supabase pooler TLS: encrypt in transit. Full CA pin is optional via DATABASE_SSL_STRICT=1
  // when your runtime trust store includes the issuer (or you supply DATABASE_SSL_CA).
  if (process.env.DATABASE_SSL_STRICT === "1") {
    const cfg = { rejectUnauthorized: true };
    if (process.env.DATABASE_SSL_CA) {
      cfg.ca = process.env.DATABASE_SSL_CA.replace(/\\n/g, "\n");
    }
    return cfg;
  }
  return { rejectUnauthorized: false };
}

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
    }
    pool = new Pool({
      connectionString,
      ssl: sslConfig(connectionString),
      max: 5,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    });
  }
  return pool;
}

export async function query(text, params) {
  const client = getPool();
  try {
    return await client.query(text, params);
  } catch (err) {
    console.error("[db] query failed:", text.slice(0, 120), err.message);
    throw err;
  }
}
