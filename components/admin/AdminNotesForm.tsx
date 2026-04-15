"use client";

import { useState } from "react";
import { SAVED_FEEDBACK_MS } from "@/lib/config/portal";
import { formatDateShort } from "@/lib/utils/format";

type Note = {
  id: string;
  body: string;
  createdAt: string;
  adminName: string | null;
};

export function AdminNotesForm({
  patientId,
  initialNotes,
}: {
  patientId: string;
  initialNotes: Note[];
}) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/patients/${patientId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim() }),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.success) {
      setError("Failed to save note.");
      return;
    }
    setNotes((prev) => [data.data, ...prev]);
    setBody("");
    setSaved(true);
    setTimeout(() => setSaved(false), SAVED_FEEDBACK_MS);
  }

  return (
    <div>
      {notes.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1.25rem" }}>
          {notes.map((n) => (
            <div
              key={n.id}
              style={{
                background: "var(--off)",
                borderRadius: "0.5rem",
                padding: "0.85rem 1rem",
                fontSize: "0.82rem",
              }}
            >
              <div style={{ color: "var(--muted)", fontSize: "0.7rem", marginBottom: "0.4rem" }}>
                {n.adminName ?? "Admin"} ·{" "}
                {formatDateShort(n.createdAt)}
              </div>
              <p style={{ color: "var(--ink2)", lineHeight: 1.65, margin: 0, whiteSpace: "pre-wrap" }}>{n.body}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a clinical note…"
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
        <button
          type="submit"
          disabled={saving || !body.trim()}
          style={{
            alignSelf: "flex-start",
            padding: "0.5rem 1.25rem",
            background: "var(--ink)",
            color: "#fff",
            border: "none",
            borderRadius: "0.5rem",
            fontSize: "0.78rem",
            letterSpacing: "0.05em",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving || !body.trim() ? 0.6 : 1,
          }}
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Add note"}
        </button>
      </form>
    </div>
  );
}
