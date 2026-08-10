// app/api/admin/pending/route.js
import { listPending, reviewPending } from "../../../../db/queries.js";

function checkAuth(request) {
  const pw = request.headers.get("x-admin-password");
  return pw && pw === process.env.ADMIN_PASSWORD;
}

export async function GET(request) {
  if (!checkAuth(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const results = await listPending("pending");
  return Response.json({ results });
}

export async function POST(request) {
  if (!checkAuth(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id, decision } = await request.json();
  if (!id || !["approved", "rejected"].includes(decision)) {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }
  await reviewPending(id, decision);
  return Response.json({ status: "ok" });
}
