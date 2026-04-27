import Link from "next/link";
import styles from "./dashboard.module.css";
import { PORTAL_ROUTES } from "@/lib/config/routes";
import { streakMessage } from "@/lib/domain/checkin";
import { CHECKIN_METRICS, type MetricKey } from "@/lib/config/portal";
import { COMPANY } from "@/lib/config/company";

type TodayScores = Record<MetricKey, number>;

export function CheckinCard({
  hasTodayCheckin,
  streak,
  atRiskStreak,
  communityToday,
  communityTotal,
  todayScores,
  todayNote,
}: {
  hasTodayCheckin: boolean;
  streak: number;
  atRiskStreak: number;
  communityToday: number;
  communityTotal: number;
  todayScores?: TodayScores;
  todayNote?: string;
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
              {COMPANY.clinicianName} reviews your trend before every consultation — 30 seconds is all it takes.
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
      <div className={styles.checkinDoneBody}>
        <p className={styles.checkinDoneLabel}>Check-in done</p>
        <p className={styles.checkinDoneText}>{streakMessage(streak)}</p>
        {todayScores && (
          <div className={styles.checkinScoreRow}>
            {CHECKIN_METRICS.map(({ key, shortLabel }) => (
              <span key={key} className={styles.checkinScoreChip}>
                <span className={styles.checkinScoreLabel}>{shortLabel}</span>
                <span className={styles.checkinScoreValue}>{todayScores[key as MetricKey]}</span>
              </span>
            ))}
          </div>
        )}
        {todayNote && (
          <p className={styles.checkinNotePreview}>{todayNote}</p>
        )}
      </div>
      <Link href={PORTAL_ROUTES.checkin} className={`${styles.cardLinkMuted} ${styles.noWrap}`}>
        Edit →
      </Link>
    </div>
  );
}
