import Link from "next/link";
import shared from "../portal.module.css";
import styles from "./dashboard.module.css";
import { DIMENSIONS, getVerdict, scoreClass, type AssessmentRow } from "@/lib/assessment/data";
import { ASSESSMENT_STALE_DAYS } from "@/lib/config/portal";
import { PORTAL_ROUTES } from "@/lib/config/routes";
import { BOOKING_STATUS_CONFIG, type BookingRow } from "@/lib/config/booking-status";
import { formatDateLong, DAY_MS } from "@/lib/utils/format";
import { COMPANY } from "@/lib/config/company";
import { OnboardingCard } from "./OnboardingCard";

interface AssessmentSectionProps {
  latestAssessment: AssessmentRow | null | undefined;
  previousAssessment?: AssessmentRow | null;
  latestBooking: Pick<BookingRow, "status" | "preferredDate"> | null | undefined;
  threadCount: number;
  unreadMessageCount?: number;
  /** When true the assessment CTA is already shown above — don't duplicate it here. */
  isNewPatient?: boolean;
}

function getLowestDimension(scores: Record<string, number>) {
  return DIMENSIONS.reduce((min, dim) =>
    (scores[dim.id] ?? 0) < (scores[min.id] ?? 0) ? dim : min
  );
}

export function AssessmentSection({
  latestAssessment,
  previousAssessment,
  latestBooking,
  threadCount,
  unreadMessageCount = 0,
  isNewPatient = false,
}: AssessmentSectionProps) {
  if (!latestAssessment) {
    // New patients already see OnboardingCard at the top of the stack.
    // Patients enrolled in a programme but not yet assessed get the CTA here.
    return isNewPatient ? null : <OnboardingCard />;
  }

  const verdict = getVerdict(latestAssessment.overallScore);
  const scores = latestAssessment.scores as Record<string, number> | undefined;
  const lowestDim = scores ? getLowestDimension(scores) : null;
  const assessmentAgeDays = Math.floor(
    (Date.now() - new Date(latestAssessment.completedAt).getTime()) / DAY_MS
  );
  const assessmentIsStale = assessmentAgeDays >= ASSESSMENT_STALE_DAYS;
  const delta =
    previousAssessment != null
      ? latestAssessment.overallScore - previousAssessment.overallScore
      : null;

  return (
    <>
      {/* Assessment result hero card */}
      <div className={styles.heroCard}>
        <div className={styles.heroCardHead}>
          <div>
            <p className={styles.heroEyebrow}>Inflection Edge</p>
            <p className={styles.heroTitle}>{verdict.name}</p>
          </div>
          <div className={styles.scoreBlock}>
            <span
              className={`${styles.scoreValue} ${scoreClass(latestAssessment.overallScore)}`}
            >
              {latestAssessment.overallScore}
            </span>
            <p className={styles.scoreDenom}>/ 100</p>
            {delta !== null && (
              <p className={delta >= 0 ? styles.scoreDeltaUp : styles.scoreDeltaDown}>
                {delta >= 0 ? `↑ +${delta}` : `↓ ${delta}`} since last
              </p>
            )}
          </div>
        </div>
        <p className={styles.heroBody}>{verdict.text}</p>
        {assessmentIsStale && (
          <p className={styles.assessmentStaleNotice}>
            Last taken {assessmentAgeDays} days ago — retaking now shows how your biology has shifted.
          </p>
        )}
        <div className={styles.heroLinks}>
          <Link href={PORTAL_ROUTES.assessments} className={styles.heroLinkPrimary}>
            Full results →
          </Link>
          <Link href={PORTAL_ROUTES.assessment} className={styles.heroLinkMuted}>
            {assessmentIsStale ? "Retake to track change →" : "Retake assessment"}
          </Link>
        </div>
      </div>

      <div className={shared.grid2}>
        {/* Highest-leverage intervention area */}
        {lowestDim && scores && (
          <div className={styles.cardWarn}>
            <p className={shared.cardTitle}>Highest-leverage area</p>
            <p className={styles.interventionName}>
              {lowestDim.icon} {lowestDim.name}
            </p>
            <p
              className={`${styles.interventionScore} ${scoreClass(scores[lowestDim.id] ?? 0)}`}
            >
              {scores[lowestDim.id] ?? 0}
            </p>
            <p className={styles.interventionHint}>
              This is where a targeted intervention delivers the most return.
            </p>
            <Link href={PORTAL_ROUTES.assessments} className={styles.cardLink}>
              Read full interpretation →
            </Link>
          </div>
        )}

        {/* Consultation card */}
        <div className={shared.card}>
          <p className={shared.cardTitle}>Consultation</p>
          {latestBooking ? (
            <>
              {(() => {
                const s =
                  BOOKING_STATUS_CONFIG[latestBooking.status] ?? BOOKING_STATUS_CONFIG.pending;
                return (
                  <span
                    className={styles.bookingStatusBadge}
                    style={{ color: s.color, background: s.bg }}
                  >
                    {s.label}
                  </span>
                );
              })()}
              {latestBooking.preferredDate && (
                <p className={styles.bookingDate}>{formatDateLong(latestBooking.preferredDate)}</p>
              )}
              <Link href={PORTAL_ROUTES.bookings} className={styles.cardLink}>
                View bookings →
              </Link>
            </>
          ) : (
            <>
              <p className={styles.bookingNoAppt}>
                Book a discovery call — no commitment, just a direct conversation with{" "}
                {COMPANY.clinicianName} to see if {COMPANY.shortName} is the right fit.
              </p>
              <Link href={PORTAL_ROUTES.bookings} className={`btn-dark ${shared.ctaBtnSmall}`}>
                Book a call →
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Messages row */}
      {threadCount > 0 && (
        <div className={`${styles.messagesRow}${unreadMessageCount > 0 ? ` ${styles.messagesRowUnread}` : ""}`}>
          <div>
            <p className={shared.cardTitle}>Messages</p>
            <p className={styles.messagesBody}>
              {unreadMessageCount > 0
                ? `${COMPANY.clinicianName} sent you ${unreadMessageCount === 1 ? "a reply" : `${unreadMessageCount} replies`} — open to read`
                : `${threadCount} active thread${threadCount !== 1 ? "s" : ""} with the ${COMPANY.shortName} team`}
            </p>
          </div>
          <Link href={PORTAL_ROUTES.messages} className={`${styles.cardLink} ${styles.noWrap}`}>
            {unreadMessageCount > 0 ? "Read reply →" : "Open messages →"}
          </Link>
        </div>
      )}
    </>
  );
}
