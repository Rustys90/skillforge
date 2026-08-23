// app/api/admin/authz-selftest/route.js
// Protected by CRON_SECRET. Verifies admin authorization matrix without exposing secrets.
// Matrix: anonymous / wrong password / primary password / secondary password (if set).

import { checkAdminPassword, createAdminToken, verifyAdminToken } from "../../../../lib/admin-auth.js";

export async function GET(request) {
  const auth = request.headers.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const header = request.headers.get("x-cron-secret") || "";
  const expected = process.env.CRON_SECRET || "";
  if (!expected || (header !== expected && bearer !== expected)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const hasPrimary = Boolean(process.env.ADMIN_PASSWORD);
  const hasSecondary = Boolean(process.env.ADMIN_PASSWORD_2);
  const hasSessionSecret = Boolean(process.env.ADMIN_SESSION_SECRET);

  // Synthetic matrix (never logs real passwords)
  const wrong = checkAdminPassword("__definitely_wrong_password__");
  const empty = checkAdminPassword("");
  const primaryOk = hasPrimary
    ? checkAdminPassword(process.env.ADMIN_PASSWORD)
    : { ok: false };
  const secondaryOk = hasSecondary
    ? checkAdminPassword(process.env.ADMIN_PASSWORD_2)
    : { ok: false };

  const token = createAdminToken("admin");
  const tokenValid = verifyAdminToken(token);
  const tokenTampered = verifyAdminToken(token.replace(/\.$/, ".deadbeef"));

  const matrix = {
    anonymous_password_empty: { expect: false, got: empty.ok, pass: empty.ok === false },
    wrong_password: { expect: false, got: wrong.ok, pass: wrong.ok === false },
    primary_password: {
      configured: hasPrimary,
      expect: hasPrimary,
      got: primaryOk.ok,
      pass: hasPrimary ? primaryOk.ok === true && primaryOk.adminId === "admin" : true,
    },
    secondary_password: {
      configured: hasSecondary,
      expect: hasSecondary,
      got: secondaryOk.ok,
      pass: hasSecondary
        ? secondaryOk.ok === true && secondaryOk.adminId === "admin2"
        : true,
    },
    session_token_valid: { expect: true, got: tokenValid, pass: tokenValid === true },
    session_token_tampered: { expect: false, got: tokenTampered, pass: tokenTampered === false },
    session_secret_dedicated: {
      configured: hasSessionSecret,
      pass: hasSessionSecret === true,
      note: hasSessionSecret
        ? "ADMIN_SESSION_SECRET is set"
        : "Set ADMIN_SESSION_SECRET so session HMAC ≠ admin password",
    },
  };

  const allPass = Object.values(matrix).every((r) => r.pass);
  return Response.json({
    ok: allPass,
    score_hint: allPass && hasSessionSecret ? 9.5 : allPass ? 9.0 : 7.5,
    matrix,
  });
}
