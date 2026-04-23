import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clinicalGoals } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import styles from "../portal.module.css";
import goalStyles from "./goals.module.css";
import { computeGoalProgress, goalProgressLabel } from "@/lib/domain/goals";
import { CHECKIN_METRICS, ASSESSMENT_GOAL_METRIC_KEY } from "@/lib/config/portal";
import { formatDateLong } from "@/lib/utils/format";

/** Map check-in metric keys to human-readable labels for goal display */
const METRIC_LABELS: Record<string, string> = Object.fromEntries(
  CHECKIN_METRICS.map((m) => [m.key, m.label])
);
METRIC_LABELS[ASSESSMENT_GOAL_METRIC_KEY] = "Assessment overall score";


export default async function GoalsPage() {
  const session = await auth();
  if (!session) return null;

  let goals: Awaited<ReturnType<typeof db.query.clinicalGoals.findMany>>;
  try {
    goals = await db.query.clinicalGoals.findMany({
      where: eq(clinicalGoals.patientId, session.user.id),
      orderBy: [asc(clinicalGoals.createdAt)],
    });
  } catch {
    return (
      <div>
        <h1 className={styles.pageTitle}>My Goals</h1>
        <p className={styles.pageSub}>Couldn&apos;t load your goals right now — please refresh.</p>
      </div>
    );
  }

  const active = goals.filter((g) => !g.completedAt);
  const completed = goals.filter((g) => g.completedAt);

  return (
    <div>
      <h1 className={styles.pageTitle}>My Goals</h1>
      <p className={styles.pageSub}>
        Clinical goals set by your clinician — updated as you progress.
      </p>

      {goals.length === 0 ? (
        <div className={`${styles.card} ${goalStyles.emptyState}`}>
          <p className={goalStyles.emptyTitle}>No goals set yet</p>
          <p className={goalStyles.emptyBody}>
            Your clinician will add clinical goals after your first consultation. They&apos;ll
            appear here with progress tracking linked to your check-ins and assessments.
          </p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className={goalStyles.section}>
              <p className={goalStyles.sectionLabel}>Active goals</p>
              <div className={goalStyles.goalList}>
                {active.map((goal) => {
                  const pct = computeGoalProgress(goal.baseline, goal.current, goal.target);
                  const hasNumbers = goal.baseline != null || goal.current != null || goal.target != null;
                  const metricLabel = goal.metric ? (METRIC_LABELS[goal.metric] ?? goal.metric) : null;

                  return (
                    <div key={goal.id} className={`${styles.card} ${goalStyles.goalCard}`}>
                      <p className={goalStyles.goalTitle}>{goal.title}</p>

                      {metricLabel && (
                        <p className={goalStyles.goalMeta}>
                          Linked metric: <span className={goalStyles.goalMetaValue}>{metricLabel}</span>
                        </p>
                      )}

                      {hasNumbers && (
                        <div className={goalStyles.progressSection}>
                          {pct !== null ? (
                            <>
                              <div className={goalStyles.progressTrack}>
                                <div
                                  className={goalStyles.progressFill}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <p className={goalStyles.progressLabel}>{goalProgressLabel(pct)}</p>
                            </>
                          ) : null}

                          <div className={goalStyles.scoreRow}>
                            {goal.baseline != null && (
                              <span className={goalStyles.scoreChip}>
                                <span className={goalStyles.scoreChipLabel}>Baseline</span>
                                <span className={goalStyles.scoreChipValue}>{goal.baseline}</span>
                              </span>
                            )}
                            {goal.current != null && (
                              <span className={goalStyles.scoreChip}>
                                <span className={goalStyles.scoreChipLabel}>Current</span>
                                <span className={goalStyles.scoreChipValue}>{goal.current}</span>
                              </span>
                            )}
                            {goal.target != null && (
                              <span className={goalStyles.scoreChip}>
                                <span className={goalStyles.scoreChipLabel}>Target</span>
                                <span className={goalStyles.scoreChipValue}>{goal.target}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {goal.notes && (
                        <p className={goalStyles.goalNotes}>{goal.notes}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div className={goalStyles.section}>
              <p className={goalStyles.sectionLabel}>Completed goals</p>
              <div className={goalStyles.goalList}>
                {completed.map((goal) => (
                  <div key={goal.id} className={`${styles.card} ${goalStyles.goalCardCompleted}`}>
                    <div className={goalStyles.completedHeader}>
                      <p className={goalStyles.goalTitle}>{goal.title}</p>
                      <span className={goalStyles.completedBadge}>Completed</span>
                    </div>
                    {goal.completedAt && (
                      <p className={goalStyles.goalMeta}>
                        Completed {formatDateLong(goal.completedAt)}
                      </p>
                    )}
                    {goal.notes && (
                      <p className={goalStyles.goalNotes}>{goal.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
