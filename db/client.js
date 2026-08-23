// db/client.js
// Single shared pg Pool. Import { query } wherever DB access is needed.

import { Pool } from "pg";

let pool;

function sslConfig(connectionString) {
  if (/localhost|127\.0\.0\.1/.test(connectionString)) return undefined;
  // Require TLS and verify the server certificate (Node default CAs cover Supabase).
  // Opt-out only via DATABASE_SSL_INSECURE=1 for broken local tunnels.
  if (process.env.DATABASE_SSL_INSECURE === "1") {
    return { rejectUnauthorized: false };
  }
  return { rejectUnauthorized: true };
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
      // Fail fast on hung connections
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
