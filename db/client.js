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
      ssl: connectionString.includes("neon.tech") ? { rejectUnauthorized: false } : undefined,
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
