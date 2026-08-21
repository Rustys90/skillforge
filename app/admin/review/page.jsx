"use client";

import { useEffect, useState } from "react";

export default function AdminReviewPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [pending, setPending] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/pending", { credentials: "include" });
      if (res.status === 401) {
        setAuthed(false);
        setPending([]);
        return;
      }
      const data = await res.json();
      setPending(data.pending || []);
      setAuthed(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const login = async () => {
    setError("");
    const res = await fetch("/api/admin/pending", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setError("Invalid password");
      return;
    }
    setPassword("");
    await load();
  };

  const decide = async (id, decision) => {
    const res = await fetch("/api/admin/pending", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, decision }),
    });
    if (!res.ok) {
      setError("Action failed");
      return;
    }
    setPending((list) => list.filter((s) => s.id !== id));
  };

  if (!authed) {
    return (
      <div style={{ padding: 40, fontFamily: "monospace", maxWidth: 420, margin: "80px auto" }}>
        <h1 style={{ fontSize: 18 }}>Admin review</h1>
        <p style={{ color: "#888", fontSize: 13 }}>Session cookie auth (HttpOnly).</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
          placeholder="Admin password"
          style={{ width: "100%", padding: 10, marginTop: 12, background: "#111", color: "#eee", border: "1px solid #333" }}
        />
        <button onClick={login} style={{ marginTop: 12, padding: "8px 16px" }}>
          Enter
        </button>
        {error && <p style={{ color: "#c66", marginTop: 12 }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ padding: 40, fontFamily: "monospace", maxWidth: 800, margin: "0 auto" }}>
      <h1>Pending review ({pending.length})</h1>
      {loading && <p style={{ color: "#888" }}>Loading…</p>}
      {error && <p style={{ color: "#c66" }}>{error}</p>}
      {pending.map((s) => (
        <div key={s.id} style={{ border: "1px solid #333", padding: 16, marginBottom: 12 }}>
          <div>
            <strong>{s.name}</strong> — {s.owner}/{s.repo} ({s.stars}★)
          </div>
          <div style={{ color: "#888", fontSize: 13, margin: "8px 0" }}>{s.description}</div>
          <div style={{ color: "#c00", fontSize: 12 }}>flags: {s.flag_reasons?.join(", ") || "none"}</div>
          <div style={{ marginTop: 8 }}>
            <button onClick={() => decide(s.id, "approved")}>Approve</button>{" "}
            <button onClick={() => decide(s.id, "rejected")}>Reject</button>
          </div>
        </div>
      ))}
      {pending.length === 0 && !loading && <p>Nothing pending.</p>}
    </div>
  );
}
