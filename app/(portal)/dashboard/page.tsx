import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  assessmentResults,
  bookings,
  threads,
  users,
  dailyCheckins,
  programmeAssignments,
  profiles,
  clinicalGoals,
} from "@/lib/db/schema";
import { eq, desc, and, isNull, gte, inArray, count } from "drizzle-orm";
import { USER_ROLE } from "@/lib/config/auth";
import { BOOKING_STATUS } from "@/lib/config/booking-status";
import shared from "../portal.module.css";
import styles from "./dashboard.module.css";
import { RECENT_ASSESSMENTS_LIMIT, DASHBOARD_TREND_DAYS } from "@/lib/config/portal";
import { COMPANY } from "@/lib/config/company";
import { formatDateISO } from "@/lib/utils/format";
import { computeStreak } from "@/lib/domain/checkin";
import { ProgrammeCard } from "./ProgrammeCard";
import { ProfileCompletenessBar } from "./ProfileCompletenessBar";
import { GoalsCard } from "./GoalsCard";
import { CheckinCard } from "./CheckinCard";
import { AssessmentSection } from "./AssessmentSection";
import { computeProfileCompleteness } from "@/lib/domain/profile";
import { getUnreadThreadCount } from "@/lib/domain/messages";
import { PendingAssessmentSaver } from "./PendingAssessmentSaver";
import { CheckinMiniTrend } from "./CheckinMiniTrend";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const now = new Date();
  const today = formatDateISO(now);
  // Fetch 110 days so streak display is accurate beyond the 100-day milestone.
  // A 60-day window would show "60-day streak" for longer streaks, which is misleading.
  const historyStart = new Date(now);
  historyStart.setDate(historyStart.getDate() - 110);
  const historyStartISO = formatDateISO(historyStart);

  const [
    recentAssessments,
    latestBooking,
    threadCount,
    unreadMessageCount,
    dbUser,
    todayCheckin,
    programmeAssignment,
    profile,
    activeGoals,
    recentCheckins,
    communityToday,
    communityTotal,
  ] = await Promise.all([
    db.query.assessmentResults.findMany({
      where: eq(assessmentResults.userId, session.user.id),
      orderBy: [desc(assessmentResults.completedAt)],
      limit: RECENT_ASSESSMENTS_LIMIT,
    }),
    db.query.bookings.findFirst({
      // Only show pending/confirmed — attended/cancelled are past and must not
      // appear as "your consultation" in the dashboard card.
      where: and(
        eq(bookings.userId, session.user.id),
        inArray(bookings.status, [BOOKING_STATUS.pending, BOOKING_STATUS.confirmed])
      ),
      orderBy: [desc(bookings.createdAt)],
    }),
    db.query.threads
      .findMany({ where: eq(threads.patientId, session.user.id) })
      .then((r) => r.length),
    getUnreadThreadCount(session.user.id),
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
    db.query.dailyCheckins.findMany({
      where: and(
        eq(dailyCheckins.userId, session.user.id),
        gte(dailyCheckins.date, historyStartISO)
      ),
      orderBy: [desc(dailyCheckins.date)],
    }),
    // Community check-in counts for social proof in the check-in prompt
    db.select({ value: count() }).from(dailyCheckins).where(eq(dailyCheckins.date, today)).then((r) => r[0]?.value ?? 0),
    db.select({ value: count() }).from(users).where(eq(users.role, USER_ROLE.patient)).then((r) => r[0]?.value ?? 0),
  ]);

  const firstName =
    dbUser?.name?.split(" ")[0] ?? session.user.email?.split("@")[0] ?? "there";
  const profilePct = computeProfileCompleteness(profile as Record<string, unknown> | null);
  const checkinStreak = computeStreak(recentCheckins);
  // Streak at risk: consecutive days ending yesterday — shown in the prompt when today isn't logged yet
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const atRiskStreak = computeStreak(recentCheckins, yesterday);
  // Last DASHBOARD_TREND_DAYS entries (DESC from DB → slice then reverse for chart)
  const trendCheckins = recentCheckins.slice(0, DASHBOARD_TREND_DAYS);

  return (
    <div>
      <PendingAssessmentSaver />
      <h1 className={shared.pageTitle}>
        Welcome back, <em>{firstName}</em>
      </h1>
      <p className={shared.pageSub}>Your {COMPANY.shortName} patient portal</p>

      <div className={styles.dashStack}>
        {programmeAssignment && (
          <ProgrammeCard
            programme={programmeAssignment.programme}
            phase={programmeAssignment.phase}
          />
        )}

        <GoalsCard goals={activeGoals} />

        <ProfileCompletenessBar pct={profilePct} />

        <CheckinCard
          hasTodayCheckin={!!todayCheckin}
          streak={checkinStreak}
          atRiskStreak={atRiskStreak}
          communityToday={communityToday}
          communityTotal={communityTotal}
          todayScores={todayCheckin ? {
            sleep: todayCheckin.sleep,
            energy: todayCheckin.energy,
            mood: todayCheckin.mood,
            focus: todayCheckin.focus,
            stress: todayCheckin.stress,
          } : undefined}
          todayNote={todayCheckin?.notes ?? undefined}
        />

        <CheckinMiniTrend checkins={trendCheckins} />

        <AssessmentSection
          latestAssessment={recentAssessments[0]}
          previousAssessment={recentAssessments[1]}
          latestBooking={latestBooking}
          threadCount={threadCount}
          unreadMessageCount={unreadMessageCount}
        />
      </div>
    </div>
  );
}
