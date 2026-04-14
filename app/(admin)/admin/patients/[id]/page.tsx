import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, assessmentResults, bookings, documents, threads } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DIMENSIONS } from "@/lib/assessment/data";
import styles from "../../../admin.module.css";

function scoreColor(score: number) {
  if (score >= 60) return "var(--teal)";
  if (score >= 40) return "var(--warn)";
  return "var(--danger)";
}

const STATUS_BADGE: Record<string, { color: string; bg: string }> = {
  pending: { color: "var(--warn)", bg: "color-mix(in srgb, var(--warn) 12%, transparent)" },
  confirmed: { color: "var(--teal)", bg: "color-mix(in srgb, var(--teal) 12%, transparent)" },
  cancelled: { color: "var(--muted)", bg: "color-mix(in srgb, var(--muted) 12%, transparent)" },
};

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "admin") return null;

  const { id } = await params;

  const patient = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      profile: true,
      assessmentResults: { orderBy: [desc(assessmentResults.completedAt)] },
      bookings: { orderBy: [desc(bookings.createdAt)] },
      documents: { orderBy: [desc(documents.createdAt)] },
      threads: { orderBy: [desc(threads.lastMessageAt)] },
    },
  });

  if (!patient) notFound();

  return (
    <div>
      <Link href="/admin/patients" style={{ fontSize: "0.78rem", color: "var(--teal)", textDecoration: "none", display: "inline-block", marginBottom: "1rem" }}>
        ← All patients
      </Link>

      <h1 className={styles.pageTitle}>{patient.name ?? <em>Unnamed patient</em>}</h1>
      <p className={styles.pageSub}>{patient.email} · joined {new Date(patient.createdAt).toLocaleDateString("en-GB")}</p>

      {/* Profile */}
      {patient.profile && (
        <div className={styles.card} style={{ marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--teal)", marginBottom: "0.75rem" }}>Profile</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", fontSize: "0.82rem" }}>
            {patient.profile.phone && <div><span style={{ color: "var(--muted)" }}>Phone: </span>{patient.profile.phone}</div>}
            {patient.profile.dateOfBirth && <div><span style={{ color: "var(--muted)" }}>DOB: </span>{patient.profile.dateOfBirth}</div>}
            {patient.profile.mainConcern && <div style={{ gridColumn: "1/-1" }}><span style={{ color: "var(--muted)" }}>Main concern: </span>{patient.profile.mainConcern}</div>}
            {patient.profile.referralSource && <div style={{ gridColumn: "1/-1" }}><span style={{ color: "var(--muted)" }}>Referred by: </span>{patient.profile.referralSource}</div>}
          </div>
        </div>
      )}

      {/* Assessment history */}
      <div className={styles.card} style={{ marginBottom: "1.25rem" }}>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--teal)", marginBottom: "0.75rem" }}>
          Assessment History ({patient.assessmentResults.length})
        </p>
        {patient.assessmentResults.length === 0 ? (
          <p style={{ fontSize: "0.82rem", color: "var(--muted)" }}>No assessments taken yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {patient.assessmentResults.map((result) => {
              const scores = result.scores as Record<string, number>;
              return (
                <div key={result.id} style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                      {new Date(result.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                    <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.8rem", fontWeight: 300, color: scoreColor(result.overallScore), lineHeight: 1 }}>
                      {result.overallScore}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem" }}>
                    {DIMENSIONS.map((dim) => {
                      const score = scores[dim.id] ?? 0;
                      return (
                        <div key={dim.id} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "0.6rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{dim.name}</div>
                          <div style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.4rem", fontWeight: 300, color: scoreColor(score) }}>{score}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bookings */}
      <div className={styles.card} style={{ marginBottom: "1.25rem" }}>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--teal)", marginBottom: "0.75rem" }}>
          Bookings ({patient.bookings.length})
        </p>
        {patient.bookings.length === 0 ? (
          <p style={{ fontSize: "0.82rem", color: "var(--muted)" }}>No bookings.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {patient.bookings.map((b) => {
              const s = STATUS_BADGE[b.status] ?? STATUS_BADGE.pending;
              return (
                <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem" }}>
                  <div>
                    <span>{b.preferredDate ?? "No date"}</span>
                    {b.notes && <span style={{ color: "var(--muted)", marginLeft: "0.5rem" }}>— {b.notes}</span>}
                  </div>
                  <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0.25rem 0.6rem", borderRadius: "1rem", color: s.color, background: s.bg }}>
                    {b.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Documents */}
      <div className={styles.card} style={{ marginBottom: "1.25rem" }}>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--teal)", marginBottom: "0.75rem" }}>
          Documents ({patient.documents.length})
        </p>
        {patient.documents.length === 0 ? (
          <p style={{ fontSize: "0.82rem", color: "var(--muted)" }}>No documents.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {patient.documents.map((d) => (
              <div key={d.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                <a href={d.fileUrl} target="_blank" rel="noreferrer" style={{ color: "var(--teal)" }}>{d.title}</a>
                <span style={{ color: "var(--muted)" }}>{new Date(d.createdAt).toLocaleDateString("en-GB")}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className={styles.card}>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--teal)", marginBottom: "0.75rem" }}>
          Messages ({patient.threads.length} thread{patient.threads.length !== 1 ? "s" : ""})
        </p>
        {patient.threads.length === 0 ? (
          <p style={{ fontSize: "0.82rem", color: "var(--muted)" }}>No messages.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {patient.threads.map((t) => (
              <Link key={t.id} href={`/admin/messages/${t.id}`} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "var(--ink)", textDecoration: "none" }}>
                <span>{t.subject}</span>
                <span style={{ color: "var(--muted)" }}>{new Date(t.lastMessageAt).toLocaleDateString("en-GB")}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
