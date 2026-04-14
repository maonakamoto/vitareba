import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assessmentResults, bookings, threads, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import styles from "../portal.module.css";
import { DIMENSIONS, VERDICT_TIERS, scoreColor } from "@/lib/assessment/data";

function getVerdict(score: number) {
  return VERDICT_TIERS.find((t) => score >= t.minScore && score <= t.maxScore) ?? VERDICT_TIERS[0];
}

function getLowestDimension(scores: Record<string, number>) {
  return DIMENSIONS.reduce((min, dim) =>
    (scores[dim.id] ?? 0) < (scores[min.id] ?? 0) ? dim : min
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const [recentAssessments, latestBooking, threadCount, dbUser] = await Promise.all([
    db.query.assessmentResults.findMany({
      where: eq(assessmentResults.userId, session.user.id),
      orderBy: [desc(assessmentResults.completedAt)],
      limit: 2,
    }),
    db.query.bookings.findFirst({
      where: eq(bookings.userId, session.user.id),
      orderBy: [desc(bookings.createdAt)],
    }),
    db.query.threads.findMany({
      where: eq(threads.patientId, session.user.id),
    }).then((r) => r.length),
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { name: true },
    }),
  ]);

  const latestAssessment = recentAssessments[0];
  const previousAssessment = recentAssessments[1];
  const firstName = dbUser?.name?.split(" ")[0] ?? session.user.email?.split("@")[0] ?? "there";

  const verdict = latestAssessment ? getVerdict(latestAssessment.overallScore) : null;
  const delta = latestAssessment && previousAssessment
    ? latestAssessment.overallScore - previousAssessment.overallScore
    : null;
  const scores = latestAssessment?.scores as Record<string, number> | undefined;
  const lowestDim = scores ? getLowestDimension(scores) : null;

  return (
    <div>
      <h1 className={styles.pageTitle}>
        Welcome, <em>{firstName}</em>
      </h1>
      <p className={styles.pageSub}>Your VitaReBa patient portal</p>

      {latestAssessment && verdict && scores ? (
        <>
          {/* Interpretation card */}
          <div style={{ background: "var(--ink)", borderRadius: "0.875rem", padding: "2rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
              <div>
                <p style={{ fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--teal)", marginBottom: "0.4rem" }}>
                  Inflection Edge
                </p>
                <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.8rem", fontWeight: 300, color: "#fff", lineHeight: 1.1 }}>
                  {verdict.name}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "3.2rem", fontWeight: 300, color: scoreColor(latestAssessment.overallScore), lineHeight: 1 }}>
                  {latestAssessment.overallScore}
                </span>
                <p style={{ fontSize: "0.62rem", color: "var(--muted)", letterSpacing: "0.08em" }}>/ 100</p>
                {delta !== null && (
                  <p style={{ fontSize: "0.72rem", color: delta >= 0 ? "var(--teal)" : "var(--danger)", marginTop: "0.2rem" }}>
                    {delta >= 0 ? `↑ +${delta}` : `↓ ${delta}`} since last
                  </p>
                )}
              </div>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--faint)", lineHeight: 1.75, maxWidth: "540px" }}>
              {verdict.text}
            </p>
            <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link href="/assessments" style={{ fontSize: "0.75rem", color: "var(--teal)", textDecoration: "none", letterSpacing: "0.06em" }}>
                Full results →
              </Link>
              <Link href="/assessment" style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textDecoration: "none", letterSpacing: "0.06em" }}>
                Retake assessment
              </Link>
            </div>
          </div>

          <div className={styles.grid2} style={{ marginBottom: "1.25rem" }}>
            {/* Key area */}
            {lowestDim && (
              <div className={styles.card} style={{ borderLeft: "3px solid var(--warn)" }}>
                <p className={styles.cardTitle}>Key intervention area</p>
                <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.5rem", fontWeight: 300, color: "var(--ink)", marginBottom: "0.5rem", lineHeight: 1.2 }}>
                  {lowestDim.icon} {lowestDim.name}
                </p>
                <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "2.2rem", fontWeight: 300, color: scoreColor(scores[lowestDim.id] ?? 0), lineHeight: 1, marginBottom: "0.75rem" }}>
                  {scores[lowestDim.id] ?? 0}
                </p>
                <Link href="/assessments" style={{ fontSize: "0.78rem", color: "var(--teal)", textDecoration: "none" }}>
                  See interpretation →
                </Link>
              </div>
            )}

            {/* Booking status */}
            <div className={styles.card}>
              <p className={styles.cardTitle}>Consultation</p>
              {latestBooking ? (
                <>
                  <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.5rem", fontWeight: 300, color: "var(--ink)", textTransform: "capitalize", marginBottom: "0.5rem", lineHeight: 1.2 }}>
                    {latestBooking.status}
                  </p>
                  {latestBooking.preferredDate && (
                    <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "0.75rem" }}>
                      {new Date(latestBooking.preferredDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}
                  <Link href="/bookings" style={{ fontSize: "0.78rem", color: "var(--teal)", textDecoration: "none" }}>
                    View bookings →
                  </Link>
                </>
              ) : (
                <>
                  <p style={{ fontSize: "0.85rem", color: "var(--ink2)", marginBottom: "0.75rem", lineHeight: 1.7 }}>
                    Request a discovery call or clinical consultation with Manuel.
                  </p>
                  <Link href="/bookings" className="btn-dark" style={{ display: "inline-block", padding: "0.6rem 1.25rem", fontSize: "0.75rem" }}>
                    Request booking →
                  </Link>
                </>
              )}
            </div>
          </div>

          {threadCount > 0 && (
            <div className={styles.card} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p className={styles.cardTitle}>Messages</p>
                <p style={{ fontSize: "0.85rem", color: "var(--ink2)" }}>
                  {threadCount} active thread{threadCount !== 1 ? "s" : ""} with the VitaReBa team
                </p>
              </div>
              <Link href="/messages" style={{ fontSize: "0.78rem", color: "var(--teal)", textDecoration: "none", whiteSpace: "nowrap" }}>
                Open messages →
              </Link>
            </div>
          )}
        </>
      ) : (
        /* No assessment yet */
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ background: "var(--ink)", borderRadius: "0.875rem", padding: "2rem" }}>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--teal)", marginBottom: "0.75rem" }}>
              Start here
            </p>
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.8rem", fontWeight: 300, color: "#fff", lineHeight: 1.2, marginBottom: "0.75rem" }}>
              Map your neurotype before your first consultation
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--faint)", lineHeight: 1.75, maxWidth: "480px", marginBottom: "1.5rem" }}>
              The Inflection Edge maps your ADHD profile across five dimensions. Your results give Manuel the data he needs to design your programme.
            </p>
            <Link href="/assessment" className="btn-dark" style={{ display: "inline-block", padding: "0.75rem 1.75rem", fontSize: "0.78rem" }}>
              Take the Inflection Edge →
            </Link>
          </div>

          <div className={styles.card}>
            <p className={styles.cardTitle}>Book a Consultation</p>
            <p style={{ fontSize: "0.85rem", color: "var(--ink2)", marginBottom: "1rem", lineHeight: 1.7 }}>
              {latestBooking
                ? `Your booking is ${latestBooking.status}.`
                : "Request an initial discovery call with Manuel."}
            </p>
            <Link href="/bookings" style={{ fontSize: "0.78rem", color: "var(--teal)", textDecoration: "none" }}>
              {latestBooking ? "View bookings →" : "Request booking →"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
