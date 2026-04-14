"use client";

import { useState, useEffect } from "react";
import styles from "../../admin.module.css";
import authStyles from "../../../(auth)/auth.module.css";

type Document = {
  id: string;
  title: string;
  fileUrl: string;
  mimeType: string | null;
  createdAt: string;
  userId: string;
};

type Patient = { id: string; name: string | null; email: string };

export default function AdminDocumentsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState("");
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const [pRes, dRes] = await Promise.all([
        fetch("/api/admin/patients"),
        fetch("/api/documents"),
      ]);
      const pData = await pRes.json();
      const dData = await dRes.json();
      setPatients(pData.data ?? []);
      setDocuments(dData.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) return;
    setSubmitting(true);
    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: patientId, title, fileUrl }),
    });
    setTitle("");
    setFileUrl("");
    setPatientId("");
    setSubmitting(false);
    const res = await fetch("/api/documents");
    const data = await res.json();
    setDocuments(data.data ?? []);
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>
        Patient <em>Documents</em>
      </h1>
      <p className={styles.pageSub}>Add document links for patients</p>

      <div className={styles.card} style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--teal)", marginBottom: "1rem" }}>Add document</p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          <div className={authStyles.field}>
            <label className={authStyles.label} htmlFor="patient">Patient</label>
            <select id="patient" className={authStyles.input} value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
              <option value="">Select a patient…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name ?? p.email} — {p.email}</option>
              ))}
            </select>
          </div>
          <div className={authStyles.field}>
            <label className={authStyles.label} htmlFor="title">Title</label>
            <input id="title" className={authStyles.input} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Assessment report, Lab results…" />
          </div>
          <div className={authStyles.field}>
            <label className={authStyles.label} htmlFor="url">File URL</label>
            <input id="url" className={authStyles.input} type="url" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} required placeholder="https://…" />
          </div>
          <button type="submit" className={authStyles.submit} style={{ marginTop: 0 }} disabled={submitting}>
            {submitting ? "Adding…" : "Add document"}
          </button>
        </form>
      </div>

      <div className={styles.card}>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--teal)", marginBottom: "1rem" }}>
          All documents ({documents.length})
        </p>
        {loading ? (
          <div className={styles.emptyState}>Loading…</div>
        ) : documents.length === 0 ? (
          <div className={styles.emptyState}>No documents yet.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Patient</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => {
                const patient = patients.find((p) => p.id === d.userId);
                return (
                  <tr key={d.id}>
                    <td>{d.title}</td>
                    <td style={{ color: "var(--muted)" }}>{patient?.name ?? patient?.email ?? "—"}</td>
                    <td style={{ color: "var(--muted)" }}>{new Date(d.createdAt).toLocaleDateString("en-GB")}</td>
                    <td>
                      <a href={d.fileUrl} target="_blank" rel="noreferrer" style={{ color: "var(--teal)", fontSize: "0.78rem" }}>Open →</a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
