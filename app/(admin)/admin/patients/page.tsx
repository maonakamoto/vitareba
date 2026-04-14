import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, assessmentResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import styles from "../../admin.module.css";

function scoreColor(score: number) {
  if (score >= 60) return "var(--teal)";
  if (score >= 40) return "var(--warn)";
  return "var(--danger)";
}

export default async function PatientsPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") return null;

  const patients = await db.query.users.findMany({
    where: eq(users.role, "patient"),
    orderBy: [desc(users.createdAt)],
    with: {
      assessmentResults: {
        orderBy: [desc(assessmentResults.completedAt)],
        limit: 1,
      },
    },
  });

  return (
    <div>
      <h1 className={styles.pageTitle}>
        All <em>Patients</em>
      </h1>
      <p className={styles.pageSub}>{patients.length} registered patient{patients.length !== 1 ? "s" : ""}</p>

      <div className={styles.card}>
        {patients.length === 0 ? (
          <div className={styles.emptyState}>No patients yet.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Latest score</th>
                <th>Registered</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => {
                const latest = p.assessmentResults[0];
                return (
                  <tr key={p.id}>
                    <td>{p.name ?? "—"}</td>
                    <td style={{ color: "var(--muted)" }}>{p.email}</td>
                    <td>
                      {latest ? (
                        <span className={styles.scoreChip} style={{ color: scoreColor(latest.overallScore) }}>
                          {latest.overallScore}
                        </span>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>—</span>
                      )}
                    </td>
                    <td style={{ color: "var(--muted)" }}>
                      {new Date(p.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td>
                      <Link href={`/admin/patients/${p.id}`} style={{ color: "var(--teal)", fontSize: "0.78rem", textDecoration: "none" }}>
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
