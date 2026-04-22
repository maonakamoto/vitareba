import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assessmentResults } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { DIMENSIONS, INTERPRETATIONS, scoreColor } from "@/lib/assessment/data";
import { formatDateLong } from "@/lib/utils/format";
import styles from "../portal.module.css";
import assessStyles from "./assessments.module.css";
import { AssessmentTrendChartWrapper } from "./AssessmentTrendChartWrapper";

function getInterpretation(dimId: string, score: number): string {
  const tiers = INTERPRETATIONS[dimId as keyof typeof INTERPRETATIONS];
  if (!tiers) return "";
  return tiers.find((t) => score <= t.maxScore)?.text ?? tiers[tiers.length - 1].text;
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

  // Build chart data (ascending for chart rendering)
  const chartData = [...results].reverse().map((r) => ({
    date: new Date(r.completedAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    }),
    score: r.overallScore,
  }));

  return (
    <div>
      <h1 className={styles.pageTitle}>
        My <em>Results</em>
      </h1>
      <p className={styles.pageSub}>Your Inflection Edge assessment history</p>

      {/* Trend chart — only shown when there are 2+ assessments */}
      {results.length >= 2 && (
        <div className={styles.cardMb}>
          <p className={styles.cardTitle}>Score trend</p>
          <AssessmentTrendChartWrapper data={chartData} />
        </div>
      )}

      {justSaved && (
        <div className={assessStyles.savedBanner}>
          <div>
            <p className={assessStyles.savedEyebrow}>Results saved</p>
            <p className={assessStyles.savedTitle}>
              Your Inflection Edge profile is now on record.
            </p>
          </div>
          <p className={assessStyles.savedBody}>
            This is your baseline. Every check-in, every retake builds on it — showing you exactly how your biology and performance evolve over time. Manuel reviews this data before every consultation to design your programme around your actual profile, not a generic template.
          </p>
          <p className={assessStyles.savedBody}>
            The single highest-leverage next step: a 30-minute discovery call with Manuel to translate your scores into a concrete plan.
          </p>
          <div className={assessStyles.savedActions}>
            <Link href="/bookings" className="btn-dark">
              Book a discovery call →
            </Link>
            <Link href="/dashboard" className={assessStyles.savedSecondary}>
              Back to dashboard
            </Link>
          </div>
        </div>
      )}

      {results.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>
            <p>No assessments yet.</p>
            <Link href="/assessment" className={assessStyles.emptyLink}>
              Take the Inflection Edge →
            </Link>
          </div>
        </div>
      ) : (
        <div className={assessStyles.resultsList}>
          {results.map((result, i) => {
            const scores = result.scores as Record<string, number>;
            return (
              <div key={result.id} className={styles.card}>
                <div className={assessStyles.resultHeader}>
                  <div>
                    <p className={styles.cardTitle}>
                      {i === 0 ? "Latest assessment" : `Assessment ${results.length - i}`}
                    </p>
                    <p className={assessStyles.resultDate}>
                      {formatDateLong(result.completedAt)}
                    </p>
                  </div>
                  <div className={assessStyles.overallBlock}>
                    <span
                      className={assessStyles.overallScore}
                      style={{ color: scoreColor(result.overallScore) }}
                    >
                      {result.overallScore}
                    </span>
                    <p className={assessStyles.overallLabel}>overall</p>
                  </div>
                </div>

                <div className={assessStyles.dimGrid}>
                  {DIMENSIONS.map((dim) => {
                    const score = scores[dim.id] ?? 0;
                    return (
                      <div key={dim.id} className={assessStyles.dimCell}>
                        <div className={assessStyles.dimIcon}>{dim.icon}</div>
                        <div
                          className={assessStyles.dimScore}
                          style={{ color: scoreColor(score) }}
                        >
                          {score}
                        </div>
                        <div className={assessStyles.dimName}>{dim.name}</div>
                        <div className={assessStyles.dimBar}>
                          <div
                            className={assessStyles.dimBarFill}
                            style={{ width: `${score}%`, background: scoreColor(score) }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={assessStyles.interpretations}>
                  {DIMENSIONS.map((dim) => {
                    const score = scores[dim.id] ?? 0;
                    const interpretation = getInterpretation(dim.id, score);
                    return (
                      <div key={dim.id} className={assessStyles.interpRow}>
                        <div className={assessStyles.interpMeta}>
                          <span
                            className={assessStyles.interpScore}
                            style={{ color: scoreColor(score) }}
                          >
                            {score}
                          </span>
                          <span className={assessStyles.interpDimName}>{dim.name}</span>
                        </div>
                        <p className={assessStyles.interpText}>{interpretation}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={assessStyles.retakeCta}>
        <p className={assessStyles.retakeHint}>
          Retake every 30 days to see how your profile shifts with your programme.
        </p>
        <Link href="/assessment" className={`btn-outline ${assessStyles.retakeBtn}`}>
          Retake assessment →
        </Link>
      </div>
    </div>
  );
}
