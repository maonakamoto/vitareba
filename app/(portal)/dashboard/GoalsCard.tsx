import shared from "../portal.module.css";
import styles from "./dashboard.module.css";
import {
  GOAL_PROGRESS_COMPLETE_PCT,
  GOAL_PROGRESS_HIGH_PCT,
  GOAL_PROGRESS_LOW_PCT,
} from "@/lib/config/portal";

type Goal = {
  id: string;
  title: string;
  baseline: number | null;
  current: number | null;
  target: number | null;
};

export function GoalsCard({ goals }: { goals: Goal[] }) {
  if (goals.length === 0) return null;

  return (
    <div className={shared.card}>
      <p className={shared.cardTitle}>Your goals</p>
      <div className={styles.goalsList}>
        {goals.map((goal) => {
          const hasProgress = goal.baseline != null || goal.current != null || goal.target != null;
          const base = goal.baseline ?? 0;
          const range = (goal.target ?? 0) - base;
          const currentPct =
            goal.current != null && goal.target != null && range > 0
              ? Math.min(100, Math.max(0, Math.round(((goal.current - base) / range) * 100)))
              : null;
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
