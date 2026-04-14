import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assessmentResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { DIMENSIONS } from "@/lib/assessment/data";
import styles from "../portal.module.css";

function scoreColor(score: number) {
  if (score >= 60) return "var(--teal)";
  if (score >= 40) return "var(--warn)";
  return "var(--danger)";
}

export default async function AssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await auth();
  if (!session) return null;

  const [params, results] = await Promise.all([
    searchParams,
    db.query.assessmentResults.findMany({
      where: eq(assessmentResults.userId, session.user.id),
      orderBy: [desc(assessmentResults.completedAt)],
    }),
  ]);

  const justSaved = params.saved === "1";

  return (
    <div>
      <h1 className={styles.pageTitle}>
        My <em>Results</em>
      </h1>
      <p className={styles.pageSub}>Your Inflection Edge assessment history</p>

      {justSaved && (
        <div style={{ background: "color-mix(in srgb, var(--teal) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--teal) 30%, transparent)", borderRadius: "0.75rem", padding: "1rem 1.25rem", marginBottom: "1.5rem", fontSize: "0.85rem", color: "var(--teal)" }}>
          Assessment saved — your results are now stored in your account.
        </div>
      )}

      {results.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>
            <p>No assessments yet.</p>
            <Link href="/assessment" style={{ color: "var(--teal)", marginTop: "0.75rem", display: "inline-block" }}>
              Take the Inflection Edge →
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {results.map((result, i) => {
            const scores = result.scores as Record<string, number>;
            return (
              <div key={result.id} className={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                  <div>
                    <p className={styles.cardTitle}>
                      {i === 0 ? "Latest assessment" : `Assessment ${results.length - i}`}
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                      {new Date(result.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "2.8rem", fontWeight: 300, color: scoreColor(result.overallScore), lineHeight: 1 }}>
                      {result.overallScore}
                    </span>
                    <p style={{ fontSize: "0.7rem", color: "var(--muted)", letterSpacing: "0.08em" }}>overall</p>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem" }}>
                  {DIMENSIONS.map((dim) => {
                    const score = scores[dim.id] ?? 0;
                    return (
                      <div key={dim.id} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>{dim.icon}</div>
                        <div style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.6rem", fontWeight: 300, color: scoreColor(score), lineHeight: 1 }}>
                          {score}
                        </div>
                        <div style={{ fontSize: "0.6rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "0.2rem" }}>
                          {dim.name}
                        </div>
                        <div style={{ height: "3px", background: "var(--border)", borderRadius: "2px", marginTop: "0.4rem" }}>
                          <div style={{ height: "100%", width: `${score}%`, background: scoreColor(score), borderRadius: "2px" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: "1.5rem" }}>
        <Link href="/assessment" className="btn-outline" style={{ display: "inline-block", padding: "0.65rem 1.5rem", fontSize: "0.78rem" }}>
          Take assessment again
        </Link>
      </div>
    </div>
  );
}
