"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../portal.module.css";
import authStyles from "../../(auth)/auth.module.css";
import msgStyles from "./messages.module.css";
import { formatDateNumeric } from "@/lib/utils/format";

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
  const [loadError, setLoadError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function load() {
    setLoadError(false);
    const res = await fetch("/api/messages");
    if (!res.ok) { setLoading(false); setLoadError(true); return; }
    const data = await res.json();
    setThreads(data.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok || !data.success) {
      setSubmitError("Failed to send message. Please try again.");
      return;
    }
    setSubject("");
    setBody("");
    setShowForm(false);
    load();
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            My <em>Messages</em>
          </h1>
          <p className={styles.pageSub}>Secure messages with the VitaReBa team</p>
        </div>
        <button type="button" className={`${authStyles.submit} ${styles.headerBtn}`} onClick={() => setShowForm(!showForm)}>
          + New message
        </button>
      </div>

      {showForm && (
        <div className={`${styles.card} ${styles.cardGap}`}>
          <p className={styles.cardTitle}>New message thread</p>
          <form onSubmit={handleSubmit} className={styles.formStack}>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="subject">Subject</label>
              <input id="subject" className={authStyles.input} value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="What is this about?" />
            </div>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="body">Message</label>
              <textarea
                id="body"
                className={styles.formTextarea}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                placeholder="Your message…"
              />
            </div>
            {submitError && <p className={styles.formError}>{submitError}</p>}
            <div className={styles.formActions}>
              <button type="submit" className={`${authStyles.submit} ${styles.formActionPrimary}`} disabled={submitting}>
                {submitting ? "Sending…" : "Send message"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className={styles.cancelBtn}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className={styles.emptyState}>Loading…</div>
      ) : loadError ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>
            Could not load messages.{" "}
            <button onClick={load} className={styles.retryBtn}>
              Retry
            </button>
          </div>
        </div>
      ) : threads.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>No messages yet. Send a message above.</div>
        </div>
      ) : (
        <div className={styles.listStack}>
          {threads.map((t) => (
            <Link key={t.id} href={`/messages/${t.id}`} className={msgStyles.threadLink}>
              <div className={styles.card}>
                <div className={msgStyles.threadRow}>
                  <p className={msgStyles.threadSubject}>{t.subject}</p>
                  <p className={msgStyles.threadDate}>
                    {formatDateNumeric(t.lastMessageAt)}
                  </p>
                </div>
                {t.messages[0] && (
                  <p className={msgStyles.threadPreview}>
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
