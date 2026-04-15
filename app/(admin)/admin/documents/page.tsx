"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../../admin.module.css";
import authStyles from "../../../(auth)/auth.module.css";
import { SAVED_FEEDBACK_MS } from "@/lib/config/portal";

type Patient = { id: string; name: string | null; email: string };
type Document = {
  id: string;
  title: string;
  fileUrl: string;
  mimeType: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
};

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [patientId, setPatientId] = useState("");
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function loadDocuments() {
    const res = await fetch("/api/documents");
    const data = await res.json();
    setDocuments(data.data ?? []);
    setLoading(false);
  }

  async function loadPatients() {
    const res = await fetch("/api/admin/patients");
    const data = await res.json();
    setPatients(data.data ?? []);
  }

  useEffect(() => {
    Promise.all([loadDocuments(), loadPatients()]);
  }, []);

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
    setPatientId("");
    setTitle("");
    setFileUrl("");
    setSubmitting(false);
    setSuccess(true);
    setShowForm(false);
    setTimeout(() => setSuccess(false), SAVED_FEEDBACK_MS);
    loadDocuments();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 className={styles.pageTitle}>
            <em>Documents</em>
          </h1>
          <p className={styles.pageSub}>Patient documents and lab results</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          style={{
            fontSize: "0.75rem", padding: "0.6rem 1.25rem",
            background: "var(--ink)", color: "#fff", border: "none",
            borderRadius: "0.5rem", cursor: "pointer", letterSpacing: "0.05em",
          }}
        >
          + Add document
        </button>
      </div>

      {success && (
        <div style={{ background: "color-mix(in srgb, var(--teal) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--teal) 30%, transparent)", borderRadius: "0.75rem", padding: "0.85rem 1.25rem", marginBottom: "1.25rem", fontSize: "0.82rem", color: "var(--teal)" }}>
          Document added successfully.
        </div>
      )}

      {showForm && (
        <div className={styles.card} style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--teal)", marginBottom: "1rem" }}>
            New document
          </p>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="doc-patient">Patient</label>
              <select
                id="doc-patient"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
                style={{ padding: "0.7rem 0", border: "none", borderBottom: "1.5px solid var(--border)", borderRadius: 0, fontSize: "0.95rem", fontFamily: "inherit", color: "var(--ink)", background: "transparent", cursor: "pointer" }}
              >
                <option value="">Select patient…</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name ? `${p.name} (${p.email})` : p.email}
                  </option>
                ))}
              </select>
            </div>
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
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit" className={authStyles.submit} style={{ marginTop: 0, flex: 1 }} disabled={submitting}>
                {submitting ? "Adding…" : "Add document"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{ flex: 1, padding: "0.75rem", border: "1px solid var(--border)", borderRadius: "0.5rem", background: "none", cursor: "pointer", fontSize: "0.8rem" }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className={styles.emptyState}>Loading…</div>
      ) : documents.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>No documents yet.</div>
        </div>
      ) : (
        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Title</th>
                <th>Type</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <Link
                      href={`/admin/patients/${doc.user.id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <div style={{ fontWeight: 400, color: "var(--ink)" }}>
                        {doc.user.name ?? <span style={{ color: "var(--muted)" }}>No name</span>}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{doc.user.email}</div>
                    </Link>
                  </td>
                  <td style={{ color: "var(--ink2)" }}>{doc.title}</td>
                  <td style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                    {doc.mimeType ?? "—"}
                  </td>
                  <td style={{ whiteSpace: "nowrap", fontSize: "0.78rem", color: "var(--muted)" }}>
                    {new Date(doc.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                  <td>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "0.78rem", color: "var(--teal)", textDecoration: "none" }}
                    >
                      Open →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
