import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { users, assessmentResults, bookings, documents, threads, threadMessages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import styles from "../../../admin.module.css";
import { DIMENSIONS, INTERPRETATIONS, VERDICT_TIERS, scoreColor } from "@/lib/assessment/data";
import { DocumentAddForm } from "@/components/admin/DocumentAddForm";

function getVerdict(score: number) {
  return VERDICT_TIERS.find((t) => score >= t.minScore && score <= t.maxScore);
}

function getInterpretation(dimId: string, score: number): string {
  const tiers = INTERPRETATIONS[dimId as keyof typeof INTERPRETATIONS];
  if (!tiers) return "";
  return tiers.find((t) => score <= t.maxScore)?.text ?? tiers[tiers.length - 1].text;
}

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
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
  if (!session || session.user.role !== "admin") redirect("/dashboard");

  const { id } = await params;

  const patient = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      profile: true,
      assessmentResults: { orderBy: [desc(assessmentResults.completedAt)] },
      bookings: { orderBy: [desc(bookings.createdAt)] },
      documents: { orderBy: [desc(documents.createdAt)] },
      threads: {
        orderBy: [desc(threads.lastMessageAt)],
        with: {
          messages: { orderBy: [desc(threadMessages.createdAt)], limit: 1 },
        },
      },
    },
  });

  if (!patient || patient.role !== "patient") notFound();

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <Link
          href="/admin/patients"
          style={{ fontSize: "0.78rem", color: "var(--teal)", textDecoration: "none", display: "inline-block", marginBottom: "0.75rem" }}
        >
          ← All patients
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className={styles.pageTitle}>
              {patient.name ? <em>{patient.name}</em> : <span style={{ color: "var(--muted)" }}>Unnamed patient</span>}
            </h1>
            <p className={styles.pageSub}>{patient.email} · registered {new Date(patient.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <Link
            href={`/admin/messages?patientId=${patient.id}`}
            style={{ fontSize: "0.78rem", background: "var(--ink)", color: "#fff", padding: "0.6rem 1.25rem", textDecoration: "none", borderRadius: "0.5rem", letterSpacing: "0.05em" }}
          >
            Send message
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

        {/* Profile */}
        <div className={styles.card}>
          <p className={styles.pageTitle} style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--teal)", marginBottom: "1rem", fontFamily: "inherit", fontWeight: 400 }}>Profile</p>
          <table style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse" }}>
            <tbody>
              {[
                ["Phone", patient.profile?.phone],
                ["Date of birth", patient.profile?.dateOfBirth],
                ["Referral source", patient.profile?.referralSource],
              ].map(([label, value]) => (
                <tr key={label as string}>
                  <td style={{ color: "var(--muted)", padding: "0.4rem 0", width: "40%" }}>{label}</td>
                  <td style={{ color: "var(--ink2)", padding: "0.4rem 0" }}>{value || <span style={{ color: "var(--faint)" }}>—</span>}</td>
                </tr>
              ))}
              {patient.profile?.mainConcern && (
                <tr>
                  <td style={{ color: "var(--muted)", padding: "0.4rem 0", verticalAlign: "top" }}>Main concern</td>
                  <td style={{ color: "var(--ink2)", padding: "0.4rem 0", lineHeight: 1.6 }}>{patient.profile.mainConcern}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Latest assessment */}
        <div className={styles.card}>
          <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--teal)", marginBottom: "1rem" }}>
            Latest Assessment {patient.assessmentResults.length > 1 && `(${patient.assessmentResults.length} total)`}
          </p>
          {patient.assessmentResults.length === 0 ? (
            <div className={styles.emptyState} style={{ padding: "1rem 0" }}>No assessments yet.</div>
          ) : (() => {
            const result = patient.assessmentResults[0];
            const scores = result.scores as Record<string, number>;
            const verdict = getVerdict(result.overallScore);
            return (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "0.35rem" }}>
                  <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "3rem", fontWeight: 300, color: scoreColor(result.overallScore), lineHeight: 1 }}>
                    {result.overallScore}
                  </span>
                  <div>
                    {verdict && <div style={{ fontSize: "0.82rem", color: "var(--ink)", fontWeight: 400 }}>{verdict.name}</div>}
                    <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                      {new Date(result.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>
                {verdict && (
                  <p style={{ fontSize: "0.78rem", color: "var(--ink2)", lineHeight: 1.65, marginBottom: "1rem" }}>
                    {verdict.text}
                  </p>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  {DIMENSIONS.map((dim) => {
                    const score = scores[dim.id] ?? 0;
                    return (
                      <div key={dim.id} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "1rem", marginBottom: "0.2rem" }}>{dim.icon}</div>
                        <div style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.4rem", fontWeight: 300, color: scoreColor(score), lineHeight: 1 }}>{score}</div>
                        <div style={{ fontSize: "0.55rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "0.15rem" }}>{dim.name}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {DIMENSIONS.map((dim) => {
                    const score = scores[dim.id] ?? 0;
                    return (
                      <div key={dim.id} style={{ display: "flex", gap: "0.5rem", alignItems: "baseline" }}>
                        <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "1rem", color: scoreColor(score), minWidth: "28px" }}>{score}</span>
                        <p style={{ fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
                          <strong style={{ color: "var(--ink2)", fontWeight: 500 }}>{dim.name}:</strong>{" "}
                          {getInterpretation(dim.id, score)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>

        {/* Bookings */}
        <div className={styles.card}>
          <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--teal)", marginBottom: "1rem" }}>
            Bookings ({patient.bookings.length})
          </p>
          {patient.bookings.length === 0 ? (
            <div className={styles.emptyState} style={{ padding: "1rem 0" }}>No bookings.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {patient.bookings.map((b) => {
                const s = STATUS_STYLES[b.status] ?? STATUS_STYLES.pending;
                return (
                  <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: "0.82rem", paddingBottom: "0.65rem", borderBottom: "1px solid var(--border)" }}>
                    <div>
                      <div style={{ color: "var(--ink2)" }}>
                        {b.preferredDate
                          ? new Date(b.preferredDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
                          : "No date preference"}
                      </div>
                      {b.notes && <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.2rem" }}>{b.notes}</div>}
                    </div>
                    <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0.2rem 0.6rem", borderRadius: "1rem", color: s.color, background: s.bg, whiteSpace: "nowrap" }}>
                      {b.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className={styles.card}>
          <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--teal)", marginBottom: "1rem" }}>
            Messages ({patient.threads.length})
          </p>
          {patient.threads.length === 0 ? (
            <div className={styles.emptyState} style={{ padding: "1rem 0" }}>No messages.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {patient.threads.map((t) => (
                <Link
                  key={t.id}
                  href={`/admin/messages/${t.id}`}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: "0.82rem", textDecoration: "none", color: "inherit", paddingBottom: "0.65rem", borderBottom: "1px solid var(--border)" }}
                >
                  <div>
                    <div style={{ color: "var(--ink2)" }}>{t.subject}</div>
                    {t.messages[0] && (
                      <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>
                        {t.messages[0].body}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "var(--teal)", whiteSpace: "nowrap" }}>View →</span>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Documents */}
      <div className={styles.card} style={{ marginTop: "1.25rem" }}>
        <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--teal)", marginBottom: "1rem" }}>
          Documents ({patient.documents.length})
        </p>
        {patient.documents.length > 0 && (
          <div style={{ marginBottom: "1.25rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {patient.documents.map((doc) => (
              <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem" }}>
                <div>
                  <div style={{ color: "var(--ink2)" }}>{doc.title}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                    {new Date(doc.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {doc.mimeType && ` · ${doc.mimeType}`}
                  </div>
                </div>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "0.78rem", color: "var(--teal)", textDecoration: "none" }}
                >
                  Open →
                </a>
              </div>
            ))}
          </div>
        )}
        <DocumentAddForm patientId={patient.id} />
      </div>
    </div>
  );
}
