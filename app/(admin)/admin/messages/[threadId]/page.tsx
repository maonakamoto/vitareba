"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import styles from "../../../admin.module.css";
import authStyles from "../../../../(auth)/auth.module.css";

type Message = {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string | null; role: string };
};

type Thread = {
  id: string;
  subject: string;
  patient: { id: string; name: string | null; email: string };
  messages: Message[];
};

export default function AdminThreadPage() {
  const params = useParams();
  const threadId = params.threadId as string;
  const [thread, setThread] = useState<Thread | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(`/api/messages/${threadId}`);
    const data = await res.json();
    setThread(data.data);
  }

  useEffect(() => { load(); }, [threadId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [thread?.messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    await fetch(`/api/messages/${threadId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setBody("");
    setSending(false);
    load();
  }

  if (!thread) return <div className={styles.emptyState}>Loading…</div>;

  return (
    <div style={{ maxWidth: "680px" }}>
      <Link
        href="/admin/messages"
        style={{ fontSize: "0.78rem", color: "var(--teal)", textDecoration: "none", display: "inline-block", marginBottom: "0.75rem" }}
      >
        ← All messages
      </Link>

      <div style={{ marginBottom: "1.5rem" }}>
        <h1 className={styles.pageTitle}>{thread.subject}</h1>
        <p className={styles.pageSub}>
          Patient: {thread.patient.name ?? thread.patient.email}
          {thread.patient.name && ` · ${thread.patient.email}`}
          {" · "}
          <Link href={`/admin/patients/${thread.patient.id}`} style={{ color: "var(--teal)", textDecoration: "none" }}>
            View profile →
          </Link>
        </p>
      </div>

      <div className={styles.card} style={{ marginBottom: "1rem", maxHeight: "55vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {thread.messages.map((msg) => {
          const isAdmin = msg.sender.role === "admin";
          return (
            <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isAdmin ? "flex-end" : "flex-start" }}>
              <div style={{
                background: isAdmin ? "var(--ink)" : "color-mix(in srgb, var(--teal) 8%, transparent)",
                border: isAdmin ? "none" : "1px solid color-mix(in srgb, var(--teal) 20%, transparent)",
                borderRadius: "0.75rem",
                padding: "0.75rem 1rem",
                maxWidth: "80%",
                fontSize: "0.85rem",
                lineHeight: 1.7,
                color: isAdmin ? "#fff" : "var(--ink)",
              }}>
                {msg.body}
              </div>
              <p style={{ fontSize: "0.68rem", color: "var(--muted)", marginTop: "0.25rem" }}>
                {isAdmin ? "You (Admin)" : (thread.patient.name ?? "Patient")}
                {" · "}
                {new Date(msg.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSend} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
          <textarea
            style={{ flex: 1, padding: "0.65rem 0.9rem", border: "1px solid var(--border)", borderRadius: "0.5rem", fontFamily: "inherit", fontSize: "0.88rem", resize: "none", minHeight: "64px" }}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Reply to patient…"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
          />
          <button
            type="submit"
            className={authStyles.submit}
            style={{ marginTop: 0, width: "auto", padding: "0.65rem 1.25rem" }}
            disabled={sending || !body.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
