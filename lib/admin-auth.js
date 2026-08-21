// lib/admin-auth.js
// Cookie-based admin session (HMAC). Still accepts legacy x-admin-password header.

import { createHmac, timingSafeEqual } from "crypto";

const COOKIE = "sf_admin";
const MAX_AGE_SEC = 60 * 60 * 12;

function secret() {
  return process.env.ADMIN_PASSWORD || process.env.CRON_SECRET || "";
}

function sign(payload) {
  const s = secret();
  if (!s) return "";
  return createHmac("sha256", s).update(payload).digest("hex");
}

export function createAdminToken() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload = `admin:${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token) {
  if (!token || typeof token !== "string") return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
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

export function isAdmin(request) {
  const cookies = parseCookies(request);
  if (verifyAdminToken(cookies[COOKIE])) return true;
  const pw = request.headers.get("x-admin-password");
  const expected = process.env.ADMIN_PASSWORD;
  if (pw && expected && pw === expected) return true;
  return false;
}

export function adminCookieHeader(token) {
  const secure = process.env.VERCEL || process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${secure}`;
}

export function clearAdminCookieHeader() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
