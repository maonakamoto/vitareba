import Link from "next/link";
import styles from "./dashboard.module.css";

export function CheckinCard({ hasTodayCheckin }: { hasTodayCheckin: boolean }) {
  if (!hasTodayCheckin) {
    return (
      <div className={styles.checkinPrompt}>
        <div>
          <p className={styles.checkinPromptLabel}>Daily check-in</p>
          <p className={styles.checkinPromptText}>
            30 seconds to log sleep, energy, mood, focus, and stress — this data feeds directly into your programme.
          </p>
        </div>
        <Link href="/checkin" className={`${styles.cardLink} ${styles.noWrap}`}>
          Check in →
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.checkinDone}>
      <span className={styles.checkinDoneCheck}>✓</span>
      <div>
        <p className={styles.checkinDoneLabel}>Check-in done</p>
        <p className={styles.checkinDoneText}>Today&apos;s data saved — your trend is growing.</p>
      </div>
      <Link href="/checkin" className={`${styles.cardLinkMuted} ${styles.noWrap}`}>
        Edit →
      </Link>
    </div>
  );
}
