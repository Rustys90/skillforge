"use client";
// app/admin/review/page.jsx
// Minimal internal review UI, protected by a shared password (not full auth).

import { useState } from "react";

export default function ReviewPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pending", { headers: { "x-admin-password": password } });
      if (!res.ok) throw new Error("unauthorized");
      const data = await res.json();
      setPending(data.results);
      setAuthed(true);
    } catch {
      alert("Wrong password or request failed.");
    } finally {
      setLoading(false);
    }
  };

  const decide = async (id, decision) => {
    await fetch("/api/admin/pending", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ id, decision }),
    });
    setPending((p) => p.filter((s) => s.id !== id));
  };

  if (!authed) {
    return (
      <div style={{ padding: 40, fontFamily: "monospace" }}>
        <h1>SkillForge Review</h1>
        <input
          type="password"
          placeholder="admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <button onClick={load} disabled={loading}>{loading ? "..." : "Enter"}</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, fontFamily: "monospace", maxWidth: 800, margin: "0 auto" }}>
      <h1>Pending review ({pending.length})</h1>
      {pending.map((s) => (
        <div key={s.id} style={{ border: "1px solid #333", padding: 16, marginBottom: 12 }}>
          <div><strong>{s.name}</strong> — {s.owner}/{s.repo} ({s.stars}★)</div>
          <div style={{ color: "#888", fontSize: 13, margin: "8px 0" }}>{s.description}</div>
          <div style={{ color: "#c00", fontSize: 12 }}>flags: {s.flag_reasons?.join(", ") || "none"}</div>
          <div style={{ marginTop: 8 }}>
            <button onClick={() => decide(s.id, "approved")}>Approve</button>{" "}
            <button onClick={() => decide(s.id, "rejected")}>Reject</button>
          </div>
        </div>
      ))}
      {pending.length === 0 && <p>Nothing pending.</p>}
    </div>
  );
}
