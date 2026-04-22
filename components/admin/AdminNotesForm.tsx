"use client";

import { useState } from "react";
import styles from "@/app/(admin)/admin.module.css";
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
        <div className={styles.notesList}>
          {notes.map((n) => (
            <div key={n.id} className={styles.noteItem}>
              <div className={styles.noteMeta}>
                {n.adminName ?? "Admin"} · {formatDateShort(n.createdAt)}
              </div>
              <p className={styles.noteBody}>{n.body}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.noteForm}>
        <textarea
          aria-label="Clinical note"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a clinical note…"
          rows={3}
          className={styles.composeTextarea}
        />
        {error && <p className={styles.assignError}>{error}</p>}
        <button type="submit" disabled={saving || !body.trim()} className={styles.assignSubmit}>
          {saving ? "Saving…" : saved ? "Saved ✓" : "Add note"}
        </button>
      </form>
    </div>
  );
}
