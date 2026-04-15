"use client";

import { useState } from "react";
import Link from "next/link";

export function InlineMessageCompose({ patientId }: { patientId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sentThreadId, setSentThreadId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    setError("");
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: subject.trim(), body: body.trim(), patientId }),
    });
    const data = await res.json();
    setSending(false);
    if (!data.success) {
      setError("Failed to send message.");
      return;
    }
    setSentThreadId(data.data?.threadId ?? data.data?.id ?? null);
    setExpanded(false);
    setSubject("");
    setBody("");
  }

  if (sentThreadId) {
    return (
      <div style={{ marginTop: "1rem", fontSize: "0.82rem", color: "var(--ink2)" }}>
        Sent —{" "}
        <Link
          href={`/admin/messages/${sentThreadId}`}
          style={{ color: "var(--teal)", textDecoration: "none" }}
        >
          View conversation →
        </Link>
      </div>
    );
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        style={{
          marginTop: "1rem",
          padding: "0.4rem 0.9rem",
          background: "transparent",
          color: "var(--teal)",
          border: "1px solid var(--teal)",
          borderRadius: "0.5rem",
          fontSize: "0.78rem",
          letterSpacing: "0.04em",
          cursor: "pointer",
        }}
      >
        New message +
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}
    >
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject"
        style={{
          padding: "0.55rem 0.9rem",
          border: "1px solid var(--border)",
          borderRadius: "0.5rem",
          fontFamily: "inherit",
          fontSize: "0.85rem",
          width: "100%",
          boxSizing: "border-box",
        }}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a message…"
        rows={3}
        style={{
          padding: "0.65rem 0.9rem",
          border: "1px solid var(--border)",
          borderRadius: "0.5rem",
          fontFamily: "inherit",
          fontSize: "0.85rem",
          resize: "vertical",
          width: "100%",
          boxSizing: "border-box",
        }}
      />
      {error && <p style={{ fontSize: "0.75rem", color: "var(--danger)", margin: 0 }}>{error}</p>}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="submit"
          disabled={sending || !subject.trim() || !body.trim()}
          style={{
            padding: "0.5rem 1.25rem",
            background: "var(--ink)",
            color: "#fff",
            border: "none",
            borderRadius: "0.5rem",
            fontSize: "0.78rem",
            letterSpacing: "0.05em",
            cursor: sending ? "not-allowed" : "pointer",
            opacity: sending || !subject.trim() || !body.trim() ? 0.6 : 1,
          }}
        >
          {sending ? "Sending…" : "Send"}
        </button>
        <button
          type="button"
          onClick={() => { setExpanded(false); setError(""); }}
          style={{
            padding: "0.5rem 0.9rem",
            background: "transparent",
            color: "var(--muted)",
            border: "1px solid var(--border)",
            borderRadius: "0.5rem",
            fontSize: "0.78rem",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
