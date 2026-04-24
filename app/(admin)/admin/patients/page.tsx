import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, assessmentResults, bookings, dailyCheckins } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import styles from "../../admin.module.css";
import { scoreColor, getVerdictName } from "@/lib/assessment/data";
import { computePatientSignal, wellnessAvg, sparkLevel } from "@/lib/domain/signals";
import { computeProfileCompleteness, profileCompletenessColor } from "@/lib/domain/profile";
import {
  SIGNAL_SORT_ORDER,
  SIGNAL_LABELS,
  SIGNAL_CHECKIN_WINDOW_DAYS,
} from "@/lib/config/admin";
import { formatDateISO, relativeDate } from "@/lib/utils/format";
import { USER_ROLE } from "@/lib/config/auth";
import { PORTAL_ROUTES, ADMIN_ROUTES } from "@/lib/config/routes";
import { getAdminUnreadPatientIds } from "@/lib/domain/messages";


export default async function PatientsPage() {
  const session = await auth();
  if (!session || session.user.role !== USER_ROLE.admin) redirect(PORTAL_ROUTES.dashboard);

  const now = new Date();

  const [patients, unreadPatientIds] = await Promise.all([
    db.query.users.findMany({
    where: eq(users.role, USER_ROLE.patient),
    with: {
      profile: true,
      assessmentResults: {
        orderBy: [desc(assessmentResults.completedAt)],
        limit: 2,
      },
      bookings: {
        orderBy: [desc(bookings.createdAt)],
        limit: 1,
      },
      dailyCheckins: {
        orderBy: [desc(dailyCheckins.date)],
        limit: SIGNAL_CHECKIN_WINDOW_DAYS,
      },
    },
  }),
    getAdminUnreadPatientIds(),
  ]);

  // Compute signal for each patient, then sort by severity then urgency
  const enriched = patients
    .map((p) => {
      const { signal, reason, urgency } = computePatientSignal({
        registeredAt: p.createdAt,
        checkins: p.dailyCheckins,
        assessments: p.assessmentResults.map((a) => ({
          overallScore: a.overallScore,
          completedAt: a.completedAt,
        })),
        bookings: p.bookings,
        now,
      });
      return { ...p, signal, reason, urgency };
    })
    .sort(
      (a, b) =>
        SIGNAL_SORT_ORDER[a.signal] - SIGNAL_SORT_ORDER[b.signal] ||
        b.urgency - a.urgency
    );

  // Build today-6..today date array for sparklines
  const sparkDates: string[] = [];
  for (let i = SIGNAL_CHECKIN_WINDOW_DAYS - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    sparkDates.push(formatDateISO(d));
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>
        <em>Patients</em>
      </h1>
      <p className={styles.pageSub}>{patients.length} registered patient{patients.length !== 1 ? "s" : ""}</p>

      <div className={styles.card}>
        {patients.length === 0 ? (
          <div className={styles.emptyState}>No patients registered yet.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Signal</th>
                <th>Patient</th>
                <th>Last check-in</th>
                <th>{SIGNAL_CHECKIN_WINDOW_DAYS} days</th>
                <th>Score</th>
                <th>Profile</th>
                <th className={styles.thCenter}>Msg</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((p) => {
                const latest = p.assessmentResults[0];
                const sortedCheckins = [...p.dailyCheckins].sort((a, b) =>
                  b.date.localeCompare(a.date)
                );
                const lastCheckin = sortedCheckins[0];
                const checkinMap = new Map(p.dailyCheckins.map((c) => [c.date, c]));
                const pct = computeProfileCompleteness(p.profile as Record<string, unknown> | null);

                const hasUnread = unreadPatientIds.has(p.id);
                return (
                  <tr key={p.id}>
                    {/* Signal */}
                    <td>
                      <span className={styles.signalBadge} data-signal={p.signal}>
                        {SIGNAL_LABELS[p.signal]}
                      </span>
                      {(p.signal === "critical" || p.signal === "attention") && (
                        <div className={styles.signalReason}>{p.reason}</div>
                      )}
                    </td>

                    {/* Patient */}
                    <td>
                      <div className={styles.cellName}>
                        {p.name ?? <span className={styles.cellMuted}>No name</span>}
                      </div>
                      <div className={styles.cellSub}>{p.email}</div>
                    </td>

                    {/* Last check-in */}
                    <td className={`${styles.cellNowrapSm}${lastCheckin ? "" : ` ${styles.cellMuted}`}`}>
                      {lastCheckin ? relativeDate(lastCheckin.date, now) : "Never"}
                    </td>

                    {/* 7-day sparkline */}
                    <td>
                      <div className={styles.sparkline}>
                        {sparkDates.map((date) => {
                          const c = checkinMap.get(date);
                          const level = c ? sparkLevel(wellnessAvg(c)) : "empty";
                          return (
                            <span
                              key={date}
                              className={styles.sparkDot}
                              data-level={level}
                              title={c ? `${date}: ${wellnessAvg(c).toFixed(1)}` : date}
                            />
                          );
                        })}
                      </div>
                    </td>

                    {/* Score */}
                    <td>
                      {latest ? (
                        <div>
                          <span className={styles.scoreChip} style={{ color: scoreColor(latest.overallScore) }}>
                            {latest.overallScore}
                          </span>
                          <div className={styles.scoreVerdict}>
                            {getVerdictName(latest.overallScore)}
                          </div>
                        </div>
                      ) : (
                        <span className={styles.cellSub}>—</span>
                      )}
                    </td>

                    {/* Profile completeness */}
                    <td className={styles.cellNowrapSm}>
                      <span style={{ color: profileCompletenessColor(pct) }}>{pct}%</span>
                    </td>

                    {/* Unread message indicator */}
                    <td className={styles.tdCenter}>
                      {hasUnread && (
                        <span className={styles.unreadDot} title="Unread message from patient" />
                      )}
                    </td>

                    {/* View */}
                    <td>
                      <Link href={`${ADMIN_ROUTES.patients}/${p.id}`} className={styles.cellLink}>
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
