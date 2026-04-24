import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, assessmentResults, bookings, dailyCheckins } from "@/lib/db/schema";
import { eq, desc, gte } from "drizzle-orm";
import styles from "../../admin.module.css";
import { computePatientSignal } from "@/lib/domain/signals";
import { SIGNAL_LABELS, SIGNAL_COLORS, SIGNAL_SORT_ORDER, SIGNAL_CHECKIN_WINDOW_DAYS, type PatientSignal } from "@/lib/config/admin";
import { USER_ROLE } from "@/lib/config/auth";
import { PORTAL_ROUTES } from "@/lib/config/routes";
import { PROGRAMME_CONFIG, PHASE_CONFIG, type ProgrammeKey, type PhaseKey } from "@/lib/config/programmes";
import { VERDICT_TIERS, getVerdictName, scoreColor } from "@/lib/assessment/data";
import { formatDateShort, formatDateISO } from "@/lib/utils/format";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className={`${styles.card} ${styles.statCardPadded}`}>
      <p className={styles.statCardLabel}>{label}</p>
      <p className={sub ? styles.statCardValueWithSub : styles.statCardValueNoSub}>{value}</p>
      {sub && <p className={styles.statCardSub}>{sub}</p>}
    </div>
  );
}

export default async function ReportsPage() {
  const session = await auth();
  if (!session || session.user.role !== USER_ROLE.admin) redirect(PORTAL_ROUTES.dashboard);

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - SIGNAL_CHECKIN_WINDOW_DAYS);
  const weekAgoStr = formatDateISO(weekAgo);

  // Fetch all patients with signal-relevant data
  const patients = await db.query.users.findMany({
    where: eq(users.role, USER_ROLE.patient),
    with: {
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

  // Signal distribution + per-patient adherence (single pass)
  const signalCounts: Record<PatientSignal, number> = {
    critical: 0,
    attention: 0,
    active: 0,
    new: 0,
  };
  const patientAdherence = patients.map((p) => {
    const { signal, reason } = computePatientSignal({
      registeredAt: p.createdAt,
      checkins: p.dailyCheckins,
      assessments: p.assessmentResults.map((a) => ({ overallScore: a.overallScore, completedAt: a.completedAt })),
      bookings: p.bookings,
      now,
    });
    signalCounts[signal]++;
    const weekCheckins = p.dailyCheckins.filter((c) => c.date >= weekAgoStr).length;
    return { id: p.id, name: p.name ?? p.email ?? "Unknown", weekCheckins, signal, reason };
  });
  // Sort: fewest check-ins first so the patients needing attention are at top
  patientAdherence.sort((a, b) => a.weekCheckins - b.weekCheckins || a.name.localeCompare(b.name));

  // Assessment stats
  const allAssessments = await db.query.assessmentResults.findMany({
    orderBy: [desc(assessmentResults.completedAt)],
  });
  const avgScore =
    allAssessments.length > 0
      ? Math.round(allAssessments.reduce((s, a) => s + a.overallScore, 0) / allAssessments.length)
      : null;

  // Score distribution by tier
  const tierCounts = VERDICT_TIERS.map((tier) => ({
    name: tier.name,
    count: allAssessments.filter((a) => a.overallScore >= tier.minScore && a.overallScore <= tier.maxScore).length,
    color: tier.color,
  }));

  // Check-in adherence this week
  const recentCheckins = await db.query.dailyCheckins.findMany({
    where: gte(dailyCheckins.date, weekAgoStr),
    columns: { userId: true },
  });
  const uniqueActiveUsers = new Set(recentCheckins.map((c) => c.userId)).size;

  // Programme distribution
  const assignments = await db.query.programmeAssignments.findMany();
  const programmeCounts: Partial<Record<ProgrammeKey, number>> = {};
  const phaseCounts: Partial<Record<PhaseKey, number>> = {};
  for (const a of assignments) {
    programmeCounts[a.programme] = (programmeCounts[a.programme] ?? 0) + 1;
    phaseCounts[a.phase] = (phaseCounts[a.phase] ?? 0) + 1;
  }

  const SIGNAL_ORDER = (Object.keys(SIGNAL_SORT_ORDER) as PatientSignal[]).sort(
    (a, b) => SIGNAL_SORT_ORDER[a] - SIGNAL_SORT_ORDER[b]
  );

  return (
    <div>
      <h1 className={styles.pageTitle}>
        <em>Reports</em>
      </h1>
      <p className={styles.pageSub}>Live snapshot — updates on every page load</p>

      {/* ── Top-level stats ──────────────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        <StatCard label="Total patients" value={patients.length} />
        <StatCard
          label="Check-ins this week"
          value={recentCheckins.length}
          sub={`${uniqueActiveUsers} of ${patients.length} patients active`}
        />
        <StatCard
          label="Assessments taken"
          value={allAssessments.length}
          sub={avgScore !== null ? `avg score ${avgScore}/100` : "no data yet"}
        />
        <StatCard
          label="Programmes assigned"
          value={assignments.length}
          sub={`${patients.length - assignments.length} unassigned`}
        />
      </div>

      <div className={styles.twoColGrid}>

        {/* ── Signal breakdown ─────────────────────────────────────────── */}
        <div className={styles.card}>
          <p className={styles.sectionLabel}>Patient signals</p>
          <div className={styles.barRow}>
            {SIGNAL_ORDER.map((signal) => {
              const count = signalCounts[signal];
              const pct = patients.length > 0 ? Math.round((count / patients.length) * 100) : 0;
              return (
                <div key={signal}>
                  <div className={styles.barRowItem}>
                    <span className={styles.signalBadge} data-signal={signal}>
                      {SIGNAL_LABELS[signal]}
                    </span>
                    <span className={styles.barCount}>
                      {count} <span className={styles.barPct}>({pct}%)</span>
                    </span>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${pct}%`,
                        background: SIGNAL_COLORS[signal as PatientSignal],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Assessment score distribution ────────────────────────────── */}
        <div className={styles.card}>
          <p className={styles.sectionLabel}>Assessment score tiers</p>
          {allAssessments.length === 0 ? (
            <div className={styles.emptyStateInline}>No assessments yet.</div>
          ) : (
            <div className={styles.barRow}>
              {tierCounts.map((tier) => {
                const pct = allAssessments.length > 0 ? Math.round((tier.count / allAssessments.length) * 100) : 0;
                return (
                  <div key={tier.name}>
                    <div className={styles.barRowItem}>
                      <span className={styles.tierName}>{tier.name}</span>
                      <span className={styles.tierCount}>{tier.count} ({pct}%)</span>
                    </div>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${pct}%`, background: tier.color }}
                      />
                    </div>
                  </div>
                );
              })}
              {avgScore !== null && (
                <p className={styles.avgNote}>
                  Population average: <strong style={{ color: scoreColor(avgScore) }}>{avgScore}/100</strong> — {getVerdictName(avgScore)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Programme distribution ───────────────────────────────────── */}
        <div className={styles.card}>
          <p className={styles.sectionLabel}>Programme distribution</p>
          {assignments.length === 0 ? (
            <div className={styles.emptyStateInline}>No assignments yet.</div>
          ) : (
            <>
              <table className={`${styles.table} ${styles.tableWithMargin}`}>
                <tbody>
                  {Object.entries(programmeCounts).map(([key, count]) => (
                    <tr key={key}>
                      <td className={styles.tableCellName}>{PROGRAMME_CONFIG[key as ProgrammeKey]?.label ?? key}</td>
                      <td className={styles.tableCellCount}>{count} patient{count !== 1 ? "s" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className={styles.phaseLabel}>By phase</p>
              <table className={styles.table}>
                <tbody>
                  {Object.entries(phaseCounts).map(([key, count]) => (
                    <tr key={key}>
                      <td className={styles.tableCellName}>{PHASE_CONFIG[key as PhaseKey]?.label ?? key}</td>
                      <td className={styles.tableCellCount}>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* ── Recent assessments ───────────────────────────────────────── */}
        <div className={styles.card}>
          <p className={styles.sectionLabel}>Recent assessments (last 10)</p>
          {allAssessments.length === 0 ? (
            <div className={styles.emptyStateInline}>No assessments yet.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Score</th>
                  <th>Tier</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {allAssessments.slice(0, 10).map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span
                        className={styles.scoreChipLarge}
                        style={{ color: scoreColor(a.overallScore) }}
                      >
                        {a.overallScore}
                      </span>
                    </td>
                    <td className={styles.tableTierCell}>{getVerdictName(a.overallScore)}</td>
                    <td className={styles.tableDateCell}>
                      {formatDateShort(a.completedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* ── Per-patient check-in adherence ───────────────────────────────── */}
      {patients.length > 0 && (
        <div className={`${styles.card} ${styles.adherenceSection}`}>
          <p className={styles.sectionLabel}>Check-in adherence — last {SIGNAL_CHECKIN_WINDOW_DAYS} days</p>
          <table className={styles.adherenceTable}>
            <thead>
              <tr>
                <th className={styles.adherenceTh}>Patient</th>
                <th className={styles.adherenceTh}>Signal</th>
                <th className={`${styles.adherenceTh} ${styles.adherenceThRight}`}>Days</th>
                <th className={styles.adherenceTh}>Progress</th>
              </tr>
            </thead>
            <tbody>
              {patientAdherence.map(({ id, name, weekCheckins, signal }) => {
                const pct = Math.round((weekCheckins / SIGNAL_CHECKIN_WINDOW_DAYS) * 100);
                const barColor =
                  weekCheckins === 0
                    ? "var(--danger)"
                    : weekCheckins < 4
                    ? "var(--warn)"
                    : "var(--teal)";
                return (
                  <tr key={id} className={styles.adherenceRow}>
                    <td className={styles.adherenceName}>
                      <a href={`/admin/patients/${id}`} className={styles.adherenceLink}>
                        {name}
                      </a>
                    </td>
                    <td className={styles.adherenceSignalCell}>
                      <span className={styles.signalBadge} data-signal={signal}>
                        {SIGNAL_LABELS[signal]}
                      </span>
                    </td>
                    <td className={styles.adherenceCount}>
                      {weekCheckins}/{SIGNAL_CHECKIN_WINDOW_DAYS}
                    </td>
                    <td className={styles.adherenceBarCell}>
                      <div className={styles.barTrack}>
                        <div
                          className={styles.barFill}
                          style={{ width: `${pct}%`, background: barColor }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
