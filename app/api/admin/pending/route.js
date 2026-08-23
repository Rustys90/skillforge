// app/api/admin/pending/route.js
import { listPending, reviewPending } from "../../../../db/queries.js";
import {
  isAdmin,
  createAdminToken,
  adminCookieHeader,
  checkAdminPassword,
} from "../../../../lib/admin-auth.js";
import { rateLimit } from "../../../../lib/rate-limit.js";

export async function GET(request) {
  if (!isAdmin(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const pending = await listPending("pending");
    return Response.json({ pending });
  } catch (err) {
    console.error("[admin/pending GET]", err.message);
    return Response.json({ error: "failed" }, { status: 500 });
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }

  // Login: password only, no id
  if (body?.password && !body?.id) {
    const rl = await rateLimit(request, "admin-login");
    if (!rl.ok) return Response.json({ error: "rate limited" }, { status: 429 });

    if (!checkAdminPassword(body.password)) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    const token = createAdminToken();
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "set-cookie": adminCookieHeader(token),
        "cache-control": "no-store",
      },
    });
  }

  if (!isAdmin(request)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rl = await rateLimit(request, "admin");
  if (!rl.ok) return Response.json({ error: "rate limited" }, { status: 429 });

  if (!body?.id || !["approved", "rejected"].includes(body.decision)) {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }
  try {
    await reviewPending(body.id, body.decision);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[admin/pending POST]", err.message);
    return Response.json({ error: "failed" }, { status: 500 });
  }
}
