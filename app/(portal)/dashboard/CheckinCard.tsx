import Link from "next/link";
import styles from "./dashboard.module.css";
import { PORTAL_ROUTES } from "@/lib/config/routes";
import { streakMessage } from "@/lib/domain/checkin";

export function CheckinCard({
  hasTodayCheckin,
  streak,
  atRiskStreak,
  communityToday,
  communityTotal,
}: {
  hasTodayCheckin: boolean;
  streak: number;
  atRiskStreak: number;
  communityToday: number;
  communityTotal: number;
}) {
  // Only show community count if there are enough patients to make it meaningful
  const showCommunity = communityTotal >= 2;

  if (!hasTodayCheckin) {
    return (
      <div className={styles.checkinPrompt}>
        <div>
          <p className={styles.checkinPromptLabel}>Daily check-in</p>
          {atRiskStreak >= 2 ? (
            <p className={styles.checkinPromptText}>
              <span className={styles.checkinStreakRisk}>🔥 {atRiskStreak}-day streak — log today to keep it alive</span>
            </p>
          ) : (
            <p className={styles.checkinPromptText}>
              30 seconds to log sleep, energy, mood, focus, and stress — this data feeds directly into your programme.
            </p>
          )}
          {showCommunity && (
            <p className={styles.communityCount}>
              {communityToday} of {communityTotal} patients checked in today
            </p>
          )}
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
        <p className={styles.checkinDoneText}>{streakMessage(streak)}</p>
      </div>
      <Link href={PORTAL_ROUTES.checkin} className={`${styles.cardLinkMuted} ${styles.noWrap}`}>
        Edit →
      </Link>
    </div>
  );
}
