// lib/admin-auth.js
// Cookie-based admin session (HMAC). Supports ADMIN_PASSWORD and ADMIN_PASSWORD_2.

import { createHmac, timingSafeEqual, randomBytes } from "crypto";

const COOKIE = "sf_admin";
const MAX_AGE_SEC = 60 * 60 * 8; // 8h

function sessionSecret() {
  const dedicated = process.env.ADMIN_SESSION_SECRET || "";
  if (dedicated) return dedicated;
  // Fallback only for local dev — production should set ADMIN_SESSION_SECRET
  return process.env.ADMIN_PASSWORD || process.env.CRON_SECRET || "";
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

/** All configured admin passwords (primary + secondary). */
function adminPasswords() {
  return [process.env.ADMIN_PASSWORD, process.env.ADMIN_PASSWORD_2]
    .filter((p) => typeof p === "string" && p.length > 0);
}

export function createAdminToken(adminId = "admin") {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const nonce = randomBytes(12).toString("hex");
  const payload = `${adminId}:${exp}:${nonce}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token) {
  if (!token || typeof token !== "string") return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  if (!safeEqualStr(sig, expected)) return false;
  const parts = payload.split(":");
  const exp = parseInt(parts[1], 10);
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

/**
 * @returns {{ ok: boolean, adminId?: string }}
 */
export function checkAdminPassword(password) {
  if (!password || typeof password !== "string") return { ok: false };
  const list = adminPasswords();
  for (let i = 0; i < list.length; i++) {
    if (safeEqualStr(password, list[i])) {
      return { ok: true, adminId: i === 0 ? "admin" : "admin2" };
    }
  }
  return { ok: false };
}

export function isAdmin(request) {
  const cookies = parseCookies(request);
  if (verifyAdminToken(cookies[COOKIE])) return true;
  // Prefer cookie sessions; header password is still accepted but discouraged
  const pw = request.headers.get("x-admin-password");
  if (pw && checkAdminPassword(pw).ok) return true;
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
