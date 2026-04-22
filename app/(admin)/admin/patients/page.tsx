import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, assessmentResults, bookings, dailyCheckins } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import styles from "../../admin.module.css";
import { scoreColor, getVerdictName } from "@/lib/assessment/data";
import { computePatientSignal, wellnessAvg } from "@/lib/domain/signals";
import { computeProfileCompleteness, profileCompletenessColor } from "@/lib/domain/profile";
import {
  SIGNAL_SORT_ORDER,
  SIGNAL_LABELS,
  SIGNAL_CHECKIN_WINDOW_DAYS,
  SPARKLINE_LOW_THRESHOLD,
  SPARKLINE_MID_THRESHOLD,
} from "@/lib/config/admin";
import { DAY_MS, formatDateISO } from "@/lib/utils/format";
import { USER_ROLE } from "@/lib/config/auth";

function relativeDate(dateStr: string, now: Date): string {
  const d = new Date(dateStr + "T00:00:00");
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / DAY_MS);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function sparkLevel(avg: number): string {
  if (avg < SPARKLINE_LOW_THRESHOLD) return "low";
  if (avg < SPARKLINE_MID_THRESHOLD) return "mid";
  return "high";
}

export default async function PatientsPage() {
  const session = await auth();
  if (!session || session.user.role !== USER_ROLE.admin) redirect("/dashboard");

  const now = new Date();

  const patients = await db.query.users.findMany({
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
  });

  // Compute signal for each patient, then sort by severity
  const enriched = patients
    .map((p) => {
      const { signal } = computePatientSignal({
        registeredAt: p.createdAt,
        checkins: p.dailyCheckins,
        assessments: p.assessmentResults.map((a) => ({
          overallScore: a.overallScore,
          completedAt: a.completedAt,
        })),
        bookings: p.bookings,
        now,
      });
      return { ...p, signal };
    })
    .sort((a, b) => SIGNAL_SORT_ORDER[a.signal] - SIGNAL_SORT_ORDER[b.signal]);

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

                return (
                  <tr key={p.id}>
                    {/* Signal */}
                    <td>
                      <span className={styles.signalBadge} data-signal={p.signal}>
                        {SIGNAL_LABELS[p.signal]}
                      </span>
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

                    {/* View */}
                    <td>
                      <Link href={`/admin/patients/${p.id}`} className={styles.cellLink}>
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
