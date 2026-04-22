import Link from "next/link";
import shared from "../portal.module.css";
import styles from "./dashboard.module.css";
import { DIMENSIONS, getVerdict, scoreColor } from "@/lib/assessment/data";
import { ASSESSMENT_STALE_DAYS } from "@/lib/config/portal";
import { PORTAL_ROUTES } from "@/lib/config/routes";
import { BOOKING_STATUS_CONFIG, type BookingRow } from "@/lib/config/booking-status";
import { formatDateLong, DAY_MS } from "@/lib/utils/format";
import { COMPANY } from "@/lib/config/company";

type AssessmentResult = {
  overallScore: number;
  completedAt: Date | string;
  scores: unknown;
};

interface AssessmentSectionProps {
  latestAssessment: AssessmentResult | null | undefined;
  previousAssessment?: AssessmentResult | null;
  latestBooking: Pick<BookingRow, "status" | "preferredDate"> | null | undefined;
  threadCount: number;
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
}: AssessmentSectionProps) {
  if (!latestAssessment) {
    return (
      <div className={styles.heroCard}>
        <p className={styles.heroEyebrow}>Start here</p>
        <p className={styles.heroTitle}>Understand your neurotype in 10 minutes</p>
        <p className={styles.ctaBody}>
          The Inflection Edge maps your ADHD profile across five dimensions: Arousal, Divergent Output,
          Hyperfocus, Volatility, and Environment Design. Your results are the clinical foundation for
          everything that follows — {COMPANY.clinicianName} reviews them before every consultation.
        </p>
        <p className={styles.ctaBodySpaced}>
          Most patients describe this as the first time they&apos;ve seen their performance pattern
          explained clearly. Take 10 minutes now.
        </p>
        <Link href={PORTAL_ROUTES.assessment} className={`btn-dark ${styles.ctaBtnLarge}`}>
          Take the Inflection Edge →
        </Link>
      </div>
    );
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
              className={styles.scoreValue}
              style={{ color: scoreColor(latestAssessment.overallScore) }}
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
              className={styles.interventionScore}
              style={{ color: scoreColor(scores[lowestDim.id] ?? 0) }}
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
                    {latestBooking.status}
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
        <div className={styles.messagesRow}>
          <div>
            <p className={shared.cardTitle}>Messages</p>
            <p className={styles.messagesBody}>
              {threadCount} active thread{threadCount !== 1 ? "s" : ""} with the {COMPANY.shortName} team
            </p>
          </div>
          <Link href={PORTAL_ROUTES.messages} className={`${styles.cardLink} ${styles.noWrap}`}>
            Open messages →
          </Link>
        </div>
      )}
    </>
  );
}
