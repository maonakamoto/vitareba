import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assessmentResults, bookings, threads } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import styles from "../portal.module.css";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const [latestAssessment, latestBooking, threadCount] = await Promise.all([
    db.query.assessmentResults.findFirst({
      where: eq(assessmentResults.userId, session.user.id),
      orderBy: [desc(assessmentResults.completedAt)],
    }),
    db.query.bookings.findFirst({
      where: eq(bookings.userId, session.user.id),
      orderBy: [desc(bookings.createdAt)],
    }),
    db.query.threads.findMany({
      where: eq(threads.patientId, session.user.id),
    }).then((r) => r.length),
  ]);

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <div>
      <h1 className={styles.pageTitle}>
        Welcome, <em>{firstName}</em>
      </h1>
      <p className={styles.pageSub}>Your VitaReBa patient portal</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem", marginBottom: "2rem" }}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Latest score</span>
          <span className={styles.statValue}>
            {latestAssessment ? `${latestAssessment.overallScore}` : "—"}
          </span>
          {latestAssessment && (
            <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>out of 100</span>
          )}
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Booking status</span>
          <span className={styles.statValue} style={{ fontSize: "1.4rem", textTransform: "capitalize" }}>
            {latestBooking?.status ?? "—"}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Message threads</span>
          <span className={styles.statValue}>{threadCount}</span>
        </div>
      </div>

      <div className={styles.grid2} style={{ marginBottom: "2rem" }}>
        <div className={styles.card}>
          <p className={styles.cardTitle}>Inflection Edge Assessment</p>
          <p style={{ fontSize: "0.85rem", color: "var(--ink2)", marginBottom: "1.25rem", lineHeight: 1.7 }}>
            {latestAssessment
              ? "You've completed the assessment. Take it again to track changes over time."
              : "Map your neurotype across 5 dimensions. 30 questions, 8 minutes."}
          </p>
          <Link href="/assessment" className="btn-dark" style={{ display: "inline-block", padding: "0.65rem 1.5rem", fontSize: "0.78rem" }}>
            {latestAssessment ? "Retake Assessment →" : "Take Assessment →"}
          </Link>
        </div>

        <div className={styles.card}>
          <p className={styles.cardTitle}>Book a Consultation</p>
          <p style={{ fontSize: "0.85rem", color: "var(--ink2)", marginBottom: "1.25rem", lineHeight: 1.7 }}>
            {latestBooking
              ? `Your latest booking is ${latestBooking.status}. View details or request a new appointment.`
              : "Request an initial discovery call or clinical consultation with Manuel."}
          </p>
          <Link href="/bookings" className="btn-dark" style={{ display: "inline-block", padding: "0.65rem 1.5rem", fontSize: "0.78rem" }}>
            {latestBooking ? "View Bookings →" : "Request Booking →"}
          </Link>
        </div>
      </div>

      {!latestAssessment && (
        <div className={styles.card} style={{ borderLeft: "3px solid var(--teal)" }}>
          <p className={styles.cardTitle}>Getting started</p>
          <ol style={{ fontSize: "0.85rem", color: "var(--ink2)", lineHeight: 2, paddingLeft: "1.25rem" }}>
            <li>Complete the Inflection Edge self-assessment</li>
            <li>Book a discovery call with Manuel</li>
            <li>Receive your personalised programme proposal</li>
          </ol>
        </div>
      )}
    </div>
  );
}
