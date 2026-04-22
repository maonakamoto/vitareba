"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import styles from "../../portal.module.css";
import msgStyles from "../messages.module.css";
import { formatDateTime } from "@/lib/utils/format";

type Message = {
  id: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  sender: { id: string; name: string | null; role: string };
};

type Thread = {
  id: string;
  subject: string;
  messages: Message[];
};

export default function ThreadPage() {
  const params = useParams();
  const threadId = params.threadId as string;
  const [thread, setThread] = useState<Thread | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(`/api/messages/${threadId}`);
    if (!res.ok) { setLoadError(true); return; }
    const data = await res.json();
    setThread(data.data);
  }

  useEffect(() => { load(); }, [threadId]);

  // Poll for new messages every 30 s while the tab is focused
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) load();
    }, 30_000);
    return () => clearInterval(interval);
  }, [threadId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [thread?.messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setSendError("");
    const res = await fetch(`/api/messages/${threadId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setSending(false);
    if (!res.ok) {
      setSendError("Failed to send. Please try again.");
      return;
    }
    setBody("");
    load();
  }

  if (loadError) return (
    <div className={styles.emptyState}>
      Could not load this conversation.{" "}
      <button onClick={() => { setLoadError(false); load(); }} className={msgStyles.retryBtn}>
        Retry
      </button>
    </div>
  );
  if (!thread) return <div className={styles.emptyState}>Loading…</div>;

  return (
    <div className={msgStyles.threadDetail}>
      <Link href="/messages" className={msgStyles.backLink}>
        ← Back to messages
      </Link>
      <h1 className={styles.pageTitle}>{thread.subject}</h1>

      <div className={`${styles.card} ${msgStyles.msgList}`}>
        {thread.messages.map((msg) => {
          const isAdmin = msg.sender.role === "admin";
          return (
            <div key={msg.id} className={`${msgStyles.msgRow} ${isAdmin ? msgStyles.msgRowAdmin : msgStyles.msgRowPatient}`}>
              <div className={`${msgStyles.msgBubble} ${isAdmin ? msgStyles.msgBubbleAdmin : msgStyles.msgBubblePatient}`}>
                {msg.body}
              </div>
              <p className={msgStyles.msgMeta}>
                {isAdmin ? "VitaReBa team" : "You"} · {formatDateTime(msg.createdAt)}
                {!isAdmin && msg.readAt && <span className={msgStyles.msgRead}> · Read</span>}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSend} className={msgStyles.composeForm}>
          <textarea
            className={msgStyles.composeTextarea}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message…"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
          />
          <button type="submit" className={msgStyles.sendBtn} disabled={sending || !body.trim()}>
            {sending ? "Sending…" : "Send"}
          </button>
        </form>
        {sendError && <p className={msgStyles.sendError}>{sendError}</p>}
      </div>
    </div>
  );
}
