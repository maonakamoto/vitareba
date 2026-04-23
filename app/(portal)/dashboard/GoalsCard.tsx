import Link from "next/link";
import shared from "../portal.module.css";
import styles from "./dashboard.module.css";
import {
  GOAL_PROGRESS_COMPLETE_PCT,
  GOAL_PROGRESS_HIGH_PCT,
  GOAL_PROGRESS_LOW_PCT,
  type GoalRow,
} from "@/lib/config/portal";
import { PORTAL_ROUTES } from "@/lib/config/routes";
import { computeGoalProgress } from "@/lib/domain/goals";

export function GoalsCard({ goals }: { goals: Pick<GoalRow, "id" | "title" | "baseline" | "current" | "target">[] }) {
  if (goals.length === 0) return null;

  return (
    <div className={shared.card}>
      <div className={styles.goalsCardHeader}>
        <p className={styles.goalsCardTitle}>Your goals</p>
        <Link href={PORTAL_ROUTES.goals} className={styles.goalsViewAll}>View all</Link>
      </div>
      <div className={styles.goalsList}>
        {goals.map((goal) => {
          const hasProgress = goal.baseline != null || goal.current != null || goal.target != null;
          const currentPct = computeGoalProgress(goal.baseline, goal.current, goal.target);
          return (
            <div key={goal.id}>
              <p className={styles.goalTitle}>{goal.title}</p>
              {hasProgress && (
                <>
                  <div className={styles.goalProgressTrack}>
                    <div
                      className={styles.goalProgressFill}
                      style={{ width: `${currentPct ?? 0}%` }}
                    />
                  </div>
                  <p className={styles.goalProgressMeta}>
                    {currentPct != null
                      ? currentPct >= GOAL_PROGRESS_COMPLETE_PCT
                        ? "Goal reached — ready for review"
                        : currentPct >= GOAL_PROGRESS_HIGH_PCT
                        ? `${currentPct}% there — in the final stretch`
                        : currentPct >= GOAL_PROGRESS_LOW_PCT
                        ? `${currentPct}% progress — building momentum`
                        : `${currentPct}% progress — just getting started`
                      : goal.current != null
                      ? `Current: ${goal.current}${goal.target != null ? ` · Target: ${goal.target}` : ""}`
                      : null}
                  </p>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
