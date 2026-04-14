"use client";

import { useState } from "react";
import authStyles from "@/app/(auth)/auth.module.css";

export function DocumentAddForm({ patientId }: { patientId: string }) {
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: patientId, title, fileUrl }),
    });
    const data = await res.json();
    if (!data.success) {
      setError("Failed to add document.");
      setSubmitting(false);
      return;
    }
    setTitle("");
    setFileUrl("");
    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <p style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        Add document
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div className={authStyles.field}>
          <label className={authStyles.label} htmlFor="doc-title">Title</label>
          <input
            id="doc-title"
            className={authStyles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Lab results, Assessment report…"
            required
          />
        </div>
        <div className={authStyles.field}>
          <label className={authStyles.label} htmlFor="doc-url">File URL</label>
          <input
            id="doc-url"
            className={authStyles.input}
            type="url"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://…"
            required
          />
        </div>
      </div>
      {error && <p style={{ fontSize: "0.75rem", color: "var(--danger)" }}>{error}</p>}
      <button
        type="submit"
        className={authStyles.submit}
        style={{ marginTop: 0, width: "auto", alignSelf: "flex-start", padding: "0.6rem 1.25rem" }}
        disabled={submitting}
      >
        {submitting ? "Adding…" : success ? "Added ✓" : "Add document"}
      </button>
    </form>
  );
}
