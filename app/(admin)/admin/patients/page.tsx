import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, assessmentResults, bookings } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import styles from "../../admin.module.css";
import { scoreColor, VERDICT_TIERS } from "@/lib/assessment/data";

function getVerdictName(score: number) {
  return VERDICT_TIERS.find((t) => score >= t.minScore && score <= t.maxScore)?.name ?? "";
}

export default async function PatientsPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/dashboard");

  const patients = await db.query.users.findMany({
    where: eq(users.role, "patient"),
    orderBy: [desc(users.createdAt)],
    with: {
      profile: true,
      assessmentResults: {
        orderBy: [desc(assessmentResults.completedAt)],
        limit: 1,
      },
      bookings: {
        orderBy: [desc(bookings.createdAt)],
        limit: 1,
      },
    },
  });

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
                <th>Patient</th>
                <th>Registered</th>
                <th>Score</th>
                <th>Bookings</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => {
                const latest = p.assessmentResults[0];
                return (
                  <tr key={p.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 400, color: "var(--ink)" }}>
                          {p.name ?? <span style={{ color: "var(--muted)" }}>No name set</span>}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{p.email}</div>
                      </div>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {new Date(p.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td>
                      {latest ? (
                        <div>
                          <span className={styles.scoreChip} style={{ color: scoreColor(latest.overallScore) }}>
                            {latest.overallScore}
                          </span>
                          <div style={{ fontSize: "0.68rem", color: "var(--muted)", marginTop: "0.15rem" }}>
                            {getVerdictName(latest.overallScore)}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: "var(--muted)", fontSize: "0.78rem" }}>No assessment</span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        fontSize: "0.72rem",
                        color: p.bookings.length > 0 ? "var(--teal)" : "var(--muted)",
                      }}>
                        {p.bookings.length > 0 ? `${p.bookings.length} booking${p.bookings.length !== 1 ? "s" : ""}` : "None"}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/admin/patients/${p.id}`}
                        style={{ fontSize: "0.78rem", color: "var(--teal)", textDecoration: "none" }}
                      >
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
