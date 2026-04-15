import Link from "next/link";
import styles from "@/app/(admin)/admin.module.css";
import { InlineMessageCompose } from "./InlineMessageCompose";

type Thread = {
  id: string;
  subject: string;
  messages: { body: string }[];
};

export function PatientMessagesCard({ threads, patientId }: { threads: Thread[]; patientId: string }) {
  return (
    <div className={styles.card}>
      <p className={styles.cardLabel}>Messages ({threads.length})</p>
      {threads.length === 0 ? (
        <div className={styles.emptyState} style={{ padding: "1rem 0" }}>No messages.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {threads.map((t) => (
            <Link
              key={t.id}
              href={`/admin/messages/${t.id}`}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: "0.82rem", textDecoration: "none", color: "inherit", paddingBottom: "0.65rem", borderBottom: "1px solid var(--border)" }}
            >
              <div>
                <div style={{ color: "var(--ink2)" }}>{t.subject}</div>
                {t.messages[0] && (
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>
                    {t.messages[0].body}
                  </div>
                )}
              </div>
              <span style={{ fontSize: "0.7rem", color: "var(--teal)", whiteSpace: "nowrap" }}>View →</span>
            </Link>
          ))}
        </div>
      )}
      <InlineMessageCompose patientId={patientId} />
    </div>
  );
}
