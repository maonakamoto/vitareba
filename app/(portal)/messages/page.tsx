"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../portal.module.css";
import authStyles from "../../(auth)/auth.module.css";

type Thread = {
  id: string;
  subject: string;
  createdAt: string;
  lastMessageAt: string;
  messages: { body: string }[];
};

export default function MessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const res = await fetch("/api/messages");
    const data = await res.json();
    setThreads(data.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body }),
    });
    setSubject("");
    setBody("");
    setShowForm(false);
    setSubmitting(false);
    load();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 className={styles.pageTitle}>
            My <em>Messages</em>
          </h1>
          <p className={styles.pageSub}>Secure messages with the VitaReBa team</p>
        </div>
        <button type="button" className={authStyles.submit} style={{ marginTop: 0, width: "auto" }} onClick={() => setShowForm(!showForm)}>
          + New message
        </button>
      </div>

      {showForm && (
        <div className={styles.card} style={{ marginBottom: "1.5rem" }}>
          <p className={styles.cardTitle}>New message thread</p>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="subject">Subject</label>
              <input id="subject" className={authStyles.input} value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="What is this about?" />
            </div>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="body">Message</label>
              <textarea
                id="body"
                style={{ padding: "0.65rem 0.9rem", border: "1px solid var(--border)", borderRadius: "0.5rem", fontFamily: "inherit", fontSize: "0.9rem", resize: "vertical", minHeight: "100px" }}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                placeholder="Your message…"
              />
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit" className={authStyles.submit} style={{ marginTop: 0, flex: 1 }} disabled={submitting}>
                {submitting ? "Sending…" : "Send message"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: "0.75rem", border: "1px solid var(--border)", borderRadius: "0.5rem", background: "none", cursor: "pointer", fontSize: "0.8rem" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className={styles.emptyState}>Loading…</div>
      ) : threads.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>No messages yet. Send a message above.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {threads.map((t) => (
            <Link key={t.id} href={`/messages/${t.id}`} style={{ textDecoration: "none" }}>
              <div className={styles.card} style={{ cursor: "pointer", transition: "border-color 0.15s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <p style={{ fontSize: "0.88rem", fontWeight: 400, color: "var(--ink)" }}>{t.subject}</p>
                  <p style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                    {new Date(t.lastMessageAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
                {t.messages[0] && (
                  <p style={{ fontSize: "0.78rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.messages[0].body}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
