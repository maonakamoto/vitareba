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
  patient: { id: string };
  messages: { body: string; senderId: string; readAt: string | null }[];
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
          <p className={styles.pageSub}>Direct line to Manuel — secure and asynchronous</p>
        </div>
        <button type="button" className={`${authStyles.submit} ${styles.headerBtn}`} onClick={() => setShowForm(!showForm)}>
          + New message
        </button>
      </div>

      {showForm && (
        <div className={`${styles.card} ${styles.cardGap}`}>
          <p className={styles.cardTitle}>New message</p>
          <p className={styles.formHint}>
            Manuel reads and responds to all messages personally. Typically within 24 hours on weekdays.
          </p>
          <form onSubmit={handleSubmit} className={styles.formStack}>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="subject">Subject</label>
              <input id="subject" className={authStyles.input} value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="e.g. Question about my medication protocol" />
            </div>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="body">Message</label>
              <textarea
                id="body"
                className={styles.formTextarea}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                placeholder="Write anything you&apos;d want Manuel to know — symptoms, questions, observations…"
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
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>No messages yet</p>
            <p>This is your direct line to Manuel and the VitaReBa team. Use it for questions between sessions, updates on how you&apos;re responding to your programme, or anything you&apos;d want your clinician to know.</p>
          </div>
        </div>
      ) : (
        <div className={styles.listStack}>
          {threads.map((t) => {
            const lastMsg = t.messages[0];
            const isUnread = !!lastMsg && lastMsg.senderId !== t.patient.id && lastMsg.readAt === null;
            return (
              <Link key={t.id} href={`/messages/${t.id}`} className={msgStyles.threadLink}>
                <div className={styles.card}>
                  <div className={msgStyles.threadRow}>
                    <div className={msgStyles.threadSubjectRow}>
                      {isUnread && <span className={msgStyles.unreadDot} />}
                      <p className={`${msgStyles.threadSubject}${isUnread ? ` ${msgStyles.threadSubjectUnread}` : ""}`}>
                        {t.subject}
                      </p>
                    </div>
                    <p className={msgStyles.threadDate}>
                      {formatDateNumeric(t.lastMessageAt)}
                    </p>
                  </div>
                  {lastMsg && (
                    <p className={msgStyles.threadPreview}>
                      {lastMsg.body}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
