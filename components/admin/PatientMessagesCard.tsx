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
        <div className={styles.emptyState}>No messages.</div>
      ) : (
        <div className={styles.msgThreadList}>
          {threads.map((t) => (
            <Link key={t.id} href={`/admin/messages/${t.id}`} className={styles.msgThreadRow}>
              <div>
                <div className={styles.msgThreadSubject}>{t.subject}</div>
                {t.messages[0] && (
                  <div className={styles.msgThreadPreview}>{t.messages[0].body}</div>
                )}
              </div>
              <span className={styles.msgThreadViewLink}>View →</span>
            </Link>
          ))}
        </div>
      )}
      <InlineMessageCompose patientId={patientId} />
    </div>
  );
}
