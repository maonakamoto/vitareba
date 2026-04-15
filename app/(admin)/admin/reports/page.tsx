import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, assessmentResults, bookings, dailyCheckins, programmeAssignments } from "@/lib/db/schema";
import { eq, desc, gte, sql } from "drizzle-orm";
import styles from "../../admin.module.css";
import { computePatientSignal } from "@/lib/domain/signals";
import { SIGNAL_LABELS, SIGNAL_COLORS, SIGNAL_CHECKIN_WINDOW_DAYS, type PatientSignal } from "@/lib/config/admin";
import { PROGRAMME_CONFIG, PHASE_CONFIG, type ProgrammeKey, type PhaseKey } from "@/lib/config/programmes";
import { VERDICT_TIERS, scoreColor } from "@/lib/assessment/data";
import { formatDateShort } from "@/lib/utils/format";

function getVerdictName(score: number) {
  return VERDICT_TIERS.find((t) => score >= t.minScore && score <= t.maxScore)?.name ?? "—";
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className={styles.card} style={{ padding: "1.25rem 1.5rem" }}>
      <p style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", marginBottom: "0.5rem" }}>
        {label}
      </p>
      <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "2.5rem", fontWeight: 300, color: "var(--ink)", lineHeight: 1, marginBottom: sub ? "0.25rem" : 0 }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{sub}</p>}
    </div>
  );
}

export default async function ReportsPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/dashboard");

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);

  // Fetch all patients with signal-relevant data
  const patients = await db.query.users.findMany({
    where: eq(users.role, "patient"),
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

  // Signal distribution
  const signalCounts: Record<PatientSignal, number> = {
    critical: 0,
    attention: 0,
    active: 0,
    new: 0,
  };
  for (const p of patients) {
    const { signal } = computePatientSignal({
      registeredAt: p.createdAt,
      checkins: p.dailyCheckins,
      assessments: p.assessmentResults.map((a) => ({ overallScore: a.overallScore, completedAt: a.completedAt })),
      bookings: p.bookings,
      now,
    });
    signalCounts[signal]++;
  }

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

  const SIGNAL_ORDER: PatientSignal[] = ["critical", "attention", "active", "new"];

  const cardLabelStyle = {
    fontSize: "0.65rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    color: "var(--muted)",
    marginBottom: "1rem",
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>
        <em>Reports</em>
      </h1>
      <p className={styles.pageSub}>Live snapshot — updates on every page load</p>

      {/* ── Top-level stats ──────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

        {/* ── Signal breakdown ─────────────────────────────────────────── */}
        <div className={styles.card}>
          <p style={cardLabelStyle}>Patient signals</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {SIGNAL_ORDER.map((signal) => {
              const count = signalCounts[signal];
              const pct = patients.length > 0 ? Math.round((count / patients.length) * 100) : 0;
              return (
                <div key={signal}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                    <span className={styles.signalBadge} data-signal={signal}>
                      {SIGNAL_LABELS[signal]}
                    </span>
                    <span style={{ fontSize: "0.82rem", color: "var(--ink2)", fontWeight: 400 }}>
                      {count} <span style={{ color: "var(--muted)", fontSize: "0.72rem" }}>({pct}%)</span>
                    </span>
                  </div>
                  <div style={{ height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        borderRadius: "2px",
                        background: SIGNAL_COLORS[signal as PatientSignal],
                        transition: "width 0.3s",
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
          <p style={cardLabelStyle}>Assessment score tiers</p>
          {allAssessments.length === 0 ? (
            <div className={styles.emptyState} style={{ padding: "1rem 0" }}>No assessments yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {tierCounts.map((tier) => {
                const pct = allAssessments.length > 0 ? Math.round((tier.count / allAssessments.length) * 100) : 0;
                return (
                  <div key={tier.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                      <span style={{ fontSize: "0.78rem", color: "var(--ink2)" }}>{tier.name}</span>
                      <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{tier.count} ({pct}%)</span>
                    </div>
                    <div style={{ height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          borderRadius: "2px",
                          background: tier.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {avgScore !== null && (
                <p style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.25rem" }}>
                  Population average: <strong style={{ color: scoreColor(avgScore) }}>{avgScore}/100</strong> — {getVerdictName(avgScore)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Programme distribution ───────────────────────────────────── */}
        <div className={styles.card}>
          <p style={cardLabelStyle}>Programme distribution</p>
          {assignments.length === 0 ? (
            <div className={styles.emptyState} style={{ padding: "1rem 0" }}>No assignments yet.</div>
          ) : (
            <>
              <table className={styles.table} style={{ marginBottom: "1.25rem" }}>
                <tbody>
                  {Object.entries(programmeCounts).map(([key, count]) => (
                    <tr key={key}>
                      <td style={{ color: "var(--ink2)" }}>{PROGRAMME_CONFIG[key as ProgrammeKey]?.label ?? key}</td>
                      <td style={{ color: "var(--muted)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{count} patient{count !== 1 ? "s" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", marginBottom: "0.75rem" }}>
                By phase
              </p>
              <table className={styles.table}>
                <tbody>
                  {Object.entries(phaseCounts).map(([key, count]) => (
                    <tr key={key}>
                      <td style={{ color: "var(--ink2)" }}>{PHASE_CONFIG[key as PhaseKey]?.label ?? key}</td>
                      <td style={{ color: "var(--muted)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* ── Recent assessments ───────────────────────────────────────── */}
        <div className={styles.card}>
          <p style={cardLabelStyle}>Recent assessments (last 10)</p>
          {allAssessments.length === 0 ? (
            <div className={styles.emptyState} style={{ padding: "1rem 0" }}>No assessments yet.</div>
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
                      <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.3rem", fontWeight: 300, color: scoreColor(a.overallScore) }}>
                        {a.overallScore}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{getVerdictName(a.overallScore)}</td>
                    <td style={{ fontSize: "0.72rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {formatDateShort(a.completedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
