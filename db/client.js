// db/client.js
// Single shared pg Pool. Import { query } wherever DB access is needed —
// works from API routes, the crawler, and the seed importer script alike.

import { Pool } from "pg";

let pool;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
    }
    pool = new Pool({
      connectionString,
      // Supabase (and most managed Postgres hosts) require SSL; skip only for
      // plain local development connections.
      ssl: /localhost|127\.0\.0\.1/.test(connectionString) ? undefined : { rejectUnauthorized: false },
      max: 5,
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
