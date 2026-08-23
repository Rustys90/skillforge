// lib/admin-auth.js
// Cookie-based admin session (HMAC). Still accepts legacy x-admin-password header.

import { createHmac, timingSafeEqual, randomBytes } from "crypto";

const COOKIE = "sf_admin";
const MAX_AGE_SEC = 60 * 60 * 12;

function sessionSecret() {
  // Prefer dedicated session secret; fall back to admin password (weaker).
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    process.env.CRON_SECRET ||
    ""
  );
}

function sign(payload) {
  const s = sessionSecret();
  if (!s) return "";
  return createHmac("sha256", s).update(payload).digest("hex");
}

function safeEqualStr(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    // Constant-time length mismatch path
    try {
      timingSafeEqual(ba, ba);
    } catch {
      /* ignore */
    }
    return false;
  }
  try {
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export function createAdminToken() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const nonce = randomBytes(8).toString("hex");
  const payload = `admin:${exp}:${nonce}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token) {
  if (!token || typeof token !== "string") return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  if (!safeEqualStr(sig, expected)) return false;
  const exp = parseInt(payload.split(":")[1], 10);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  return true;
}

export function parseCookies(request) {
  const header = request.headers.get("cookie") || "";
  const out = {};
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k) out[k] = decodeURIComponent(rest.join("=") || "");
  }
  return out;
}

export function checkAdminPassword(password) {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected || !password) return false;
  return safeEqualStr(String(password), expected);
}

export function isAdmin(request) {
  const cookies = parseCookies(request);
  if (verifyAdminToken(cookies[COOKIE])) return true;
  const pw = request.headers.get("x-admin-password");
  if (pw && checkAdminPassword(pw)) return true;
  return false;
}

export function adminCookieHeader(token) {
  const secure =
    process.env.VERCEL || process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE_SEC}${secure}`;
}

export function clearAdminCookieHeader() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

// silence unused import lint if scrypt kept for future password hashing
