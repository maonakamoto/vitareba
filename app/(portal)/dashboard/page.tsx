import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assessmentResults, bookings, threads, users, dailyCheckins, programmeAssignments, profiles, clinicalGoals } from "@/lib/db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";
import Link from "next/link";
import shared from "../portal.module.css";
import styles from "./dashboard.module.css";
import { DIMENSIONS, getVerdict, scoreColor } from "@/lib/assessment/data";
import { RECENT_ASSESSMENTS_LIMIT } from "@/lib/config/portal";
import { BOOKING_STATUS_CONFIG } from "@/lib/config/booking-status";
import { formatDateLong } from "@/lib/utils/format";
import { ProgrammeCard } from "./ProgrammeCard";
import { ProfileCompletenessBar } from "./ProfileCompletenessBar";
import { computeProfileCompleteness } from "@/lib/domain/profile";

function getLowestDimension(scores: Record<string, number>) {
  return DIMENSIONS.reduce((min, dim) =>
    (scores[dim.id] ?? 0) < (scores[min.id] ?? 0) ? dim : min
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const now = Date.now();
  const today = new Date(now).toISOString().slice(0, 10);

  const [recentAssessments, latestBooking, threadCount, dbUser, todayCheckin, programmeAssignment, profile, activeGoals] = await Promise.all([
    db.query.assessmentResults.findMany({
      where: eq(assessmentResults.userId, session.user.id),
      orderBy: [desc(assessmentResults.completedAt)],
      limit: RECENT_ASSESSMENTS_LIMIT,
    }),
    db.query.bookings.findFirst({
      where: eq(bookings.userId, session.user.id),
      orderBy: [desc(bookings.createdAt)],
    }),
    db.query.threads
      .findMany({ where: eq(threads.patientId, session.user.id) })
      .then((r) => r.length),
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { name: true },
    }),
    db.query.dailyCheckins.findFirst({
      where: and(
        eq(dailyCheckins.userId, session.user.id),
        eq(dailyCheckins.date, today)
      ),
    }),
    db.query.programmeAssignments.findFirst({
      where: eq(programmeAssignments.patientId, session.user.id),
    }),
    db.query.profiles.findFirst({
      where: eq(profiles.userId, session.user.id),
    }),
    db.query.clinicalGoals.findMany({
      where: and(
        eq(clinicalGoals.patientId, session.user.id),
        isNull(clinicalGoals.completedAt)
      ),
    }),
  ]);

  const latestAssessment = recentAssessments[0];
  const previousAssessment = recentAssessments[1];
  const firstName = dbUser?.name?.split(" ")[0] ?? session.user.email?.split("@")[0] ?? "there";

  const profilePct = computeProfileCompleteness(profile as Record<string, unknown> | null);
  const verdict = latestAssessment ? getVerdict(latestAssessment.overallScore) : null;
  const assessmentAgeDays = latestAssessment
    ? Math.floor((now - new Date(latestAssessment.completedAt).getTime()) / (24 * 60 * 60 * 1000))
    : null;
  const assessmentIsStale = assessmentAgeDays !== null && assessmentAgeDays >= 30;
  const delta =
    latestAssessment && previousAssessment
      ? latestAssessment.overallScore - previousAssessment.overallScore
      : null;
  const scores = latestAssessment?.scores as Record<string, number> | undefined;
  const lowestDim = scores ? getLowestDimension(scores) : null;

  return (
    <div>
      <h1 className={shared.pageTitle}>
        Welcome back, <em>{firstName}</em>
      </h1>
      <p className={shared.pageSub}>Your VitaReBa patient portal</p>

      <div className={styles.dashStack}>

        {/* ── Programme card ─────────────────────────────────────────── */}
        {programmeAssignment && (
          <ProgrammeCard
            programme={programmeAssignment.programme}
            phase={programmeAssignment.phase}
          />
        )}

        {/* ── Clinical goals ─────────────────────────────────────────── */}
        {activeGoals.length > 0 && (
          <div className={shared.card}>
            <p className={shared.cardTitle}>Your goals</p>
            <div className={styles.goalsList}>
              {activeGoals.map((goal) => {
                const hasProgress = goal.baseline != null || goal.current != null || goal.target != null;
                // Progress from baseline to target; fallback to 0-based if no baseline
                const base = goal.baseline ?? 0;
                const range = (goal.target ?? 0) - base;
                const currentPct =
                  goal.current != null && goal.target != null && range > 0
                    ? Math.min(100, Math.max(0, Math.round(((goal.current - base) / range) * 100)))
                    : null;
                return (
                  <div key={goal.id}>
                    <p className={styles.goalTitle}>{goal.title}</p>
                    {hasProgress && (
                      <>
                        <div className={styles.goalProgressTrack}>
                          <div
                            className={styles.goalProgressFill}
                            style={{ width: `${currentPct ?? 0}%` }}
                          />
                        </div>
                        <p className={styles.goalProgressMeta}>
                          {currentPct != null
                            ? currentPct >= 100
                              ? "Goal reached — ready for review"
                              : currentPct >= 75
                              ? `${currentPct}% there — in the final stretch`
                              : currentPct >= 40
                              ? `${currentPct}% progress — building momentum`
                              : `${currentPct}% progress — just getting started`
                            : goal.current != null
                            ? `Current: ${goal.current}${goal.target != null ? ` · Target: ${goal.target}` : ""}`
                            : null}
                        </p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Profile completeness bar ───────────────────────────────── */}
        <ProfileCompletenessBar pct={profilePct} />

        {/* ── Check-in prompt ────────────────────────────────────────── */}
        {!todayCheckin ? (
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
        ) : (
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
        )}

        {latestAssessment && verdict && scores ? (
          <>
            {/* ── Assessment result card ─────────────────────────────── */}
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
                <Link href="/assessments" className={styles.heroLinkPrimary}>
                  Full results →
                </Link>
                <Link href="/assessment" className={styles.heroLinkMuted}>
                  {assessmentIsStale ? "Retake to track change →" : "Retake assessment"}
                </Link>
              </div>
            </div>

            <div className={shared.grid2}>
              {/* ── Key intervention area ─────────────────────────── */}
              {lowestDim && (
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
                  <Link href="/assessments" className={styles.cardLink}>
                    Read full interpretation →
                  </Link>
                </div>
              )}

              {/* ── Consultation ─────────────────────────────────── */}
              <div className={shared.card}>
                <p className={shared.cardTitle}>Consultation</p>
                {latestBooking ? (
                  <>
                    {(() => {
                      const s = BOOKING_STATUS_CONFIG[latestBooking.status as keyof typeof BOOKING_STATUS_CONFIG] ?? BOOKING_STATUS_CONFIG.pending;
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
                      <p className={styles.bookingDate}>
                        {formatDateLong(latestBooking.preferredDate)}
                      </p>
                    )}
                    <Link href="/bookings" className={styles.cardLink}>
                      View bookings →
                    </Link>
                  </>
                ) : (
                  <>
                    <p className={styles.bookingNoAppt}>
                      Book a discovery call — no commitment, just a direct conversation with Manuel to see if VitaReBa is the right fit.
                    </p>
                    <Link href="/bookings" className={`btn-dark ${shared.ctaBtnSmall}`}>
                      Book a call →
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* ── Messages ─────────────────────────────────────────── */}
            {threadCount > 0 && (
              <div className={styles.messagesRow}>
                <div>
                  <p className={shared.cardTitle}>Messages</p>
                  <p className={styles.messagesBody}>
                    {threadCount} active thread{threadCount !== 1 ? "s" : ""} with the VitaReBa team
                  </p>
                </div>
                <Link href="/messages" className={`${styles.cardLink} ${styles.noWrap}`}>
                  Open messages →
                </Link>
              </div>
            )}
          </>
        ) : (
          /* ── No assessment yet ─────────────────────────────────────── */
          <>
            <div className={styles.heroCard}>
              <p className={styles.heroEyebrow}>Start here</p>
              <p className={styles.heroTitle}>
                Understand your neurotype in 10 minutes
              </p>
              <p className={styles.ctaBody}>
                The Inflection Edge maps your ADHD profile across five dimensions: Arousal, Divergent Output, Hyperfocus, Volatility, and Environment Design. Your results are the clinical foundation for everything that follows — Manuel reviews them before every consultation.
              </p>
              <p className={styles.ctaBodySpaced}>
                Most patients describe this as the first time they&apos;ve seen their performance pattern explained clearly. Take 10 minutes now.
              </p>
              <Link href="/assessment" className={`btn-dark ${styles.ctaBtnLarge}`}>
                Take the Inflection Edge →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
