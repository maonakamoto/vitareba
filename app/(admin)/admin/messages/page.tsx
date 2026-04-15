import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { threads, threadMessages } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import styles from "../../admin.module.css";
import { formatDateShort } from "@/lib/utils/format";

export default async function AdminMessagesPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/dashboard");

  const allThreads = await db.query.threads.findMany({
    orderBy: [desc(threads.lastMessageAt)],
    with: {
      patient: { columns: { id: true, name: true, email: true } },
      messages: { orderBy: [desc(threadMessages.createdAt)], limit: 1 },
    },
  });

  return (
    <div>
      <h1 className={styles.pageTitle}>
        <em>Messages</em>
      </h1>
      <p className={styles.pageSub}>{allThreads.length} thread{allThreads.length !== 1 ? "s" : ""}</p>

      {allThreads.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>No message threads yet.</div>
        </div>
      ) : (
        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Subject</th>
                <th>Last message</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allThreads.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 400, color: "var(--ink)" }}>
                      {t.patient.name ?? <span style={{ color: "var(--muted)" }}>No name</span>}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{t.patient.email}</div>
                  </td>
                  <td style={{ color: "var(--ink2)" }}>{t.subject}</td>
                  <td style={{ maxWidth: "220px" }}>
                    {t.messages[0] ? (
                      <span style={{ fontSize: "0.78rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                        {t.messages[0].body}
                      </span>
                    ) : (
                      <span style={{ color: "var(--faint)" }}>—</span>
                    )}
                  </td>
                  <td style={{ whiteSpace: "nowrap", fontSize: "0.78rem", color: "var(--muted)" }}>
                    {formatDateShort(t.lastMessageAt)}
                  </td>
                  <td>
                    <Link
                      href={`/admin/messages/${t.id}`}
                      style={{ fontSize: "0.78rem", color: "var(--teal)", textDecoration: "none" }}
                    >
                      Open →
                    </Link>
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
