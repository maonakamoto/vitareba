import Link from "next/link";
import styles from "./dashboard.module.css";
import { PORTAL_ROUTES } from "@/lib/config/routes";

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
        <Link href={PORTAL_ROUTES.checkin} className={`${styles.cardLink} ${styles.noWrap}`}>
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
      <Link href={PORTAL_ROUTES.checkin} className={`${styles.cardLinkMuted} ${styles.noWrap}`}>
        Edit →
      </Link>
    </div>
  );
}
