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
import { eq, desc, and, isNull } from "drizzle-orm";
import shared from "../portal.module.css";
import styles from "./dashboard.module.css";
import { RECENT_ASSESSMENTS_LIMIT } from "@/lib/config/portal";
import { formatDateISO } from "@/lib/utils/format";
import { ProgrammeCard } from "./ProgrammeCard";
import { ProfileCompletenessBar } from "./ProfileCompletenessBar";
import { GoalsCard } from "./GoalsCard";
import { CheckinCard } from "./CheckinCard";
import { AssessmentSection } from "./AssessmentSection";
import { computeProfileCompleteness } from "@/lib/domain/profile";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const today = formatDateISO(new Date());

  const [
    recentAssessments,
    latestBooking,
    threadCount,
    dbUser,
    todayCheckin,
    programmeAssignment,
    profile,
    activeGoals,
  ] = await Promise.all([
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

  const firstName =
    dbUser?.name?.split(" ")[0] ?? session.user.email?.split("@")[0] ?? "there";
  const profilePct = computeProfileCompleteness(profile as Record<string, unknown> | null);

  return (
    <div>
      <h1 className={shared.pageTitle}>
        Welcome back, <em>{firstName}</em>
      </h1>
      <p className={shared.pageSub}>Your VitaReBa patient portal</p>

      <div className={styles.dashStack}>
        {programmeAssignment && (
          <ProgrammeCard
            programme={programmeAssignment.programme}
            phase={programmeAssignment.phase}
          />
        )}

        <GoalsCard goals={activeGoals} />

        <ProfileCompletenessBar pct={profilePct} />

        <CheckinCard hasTodayCheckin={!!todayCheckin} />

        <AssessmentSection
          latestAssessment={recentAssessments[0]}
          previousAssessment={recentAssessments[1]}
          latestBooking={latestBooking}
          threadCount={threadCount}
        />
      </div>
    </div>
  );
}
