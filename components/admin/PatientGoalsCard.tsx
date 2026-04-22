"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "@/app/(admin)/admin.module.css";
import { type GoalRow } from "@/lib/config/portal";

function GoalProgressBar({ baseline, current, target }: { baseline: number | null; current: number | null; target: number | null }) {
  if (current == null && target == null) return null;
  const max = Math.max(target ?? 0, current ?? 0, baseline ?? 0, 100);
  const baselinePct = baseline != null ? (baseline / max) * 100 : null;
  const currentPct = current != null ? (current / max) * 100 : null;
  const targetPct = target != null ? (target / max) * 100 : null;

  return (
    <div className={styles.goalBar}>
      {currentPct != null && (
        <div
          className={styles.goalBarFill}
          style={{
            left: `${baselinePct ?? 0}%`,
            width: `${Math.max(0, currentPct - (baselinePct ?? 0))}%`,
          }}
        />
      )}
      {targetPct != null && (
        <div className={styles.goalBarTarget} style={{ left: `${targetPct}%` }} />
      )}
    </div>
  );
}

export function PatientGoalsCard({ patientId }: { patientId: string }) {
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", metric: "", baseline: "", target: "", current: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCurrent, setEditCurrent] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/patients/${patientId}/goals`);
    if (!res.ok) return;
    const data = await res.json();
    setGoals(data.data ?? []);
    setLoading(false);
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/admin/patients/${patientId}/goals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        metric: form.metric || null,
        baseline: form.baseline !== "" ? Number(form.baseline) : null,
        target: form.target !== "" ? Number(form.target) : null,
        current: form.current !== "" ? Number(form.current) : null,
        notes: form.notes || null,
      }),
    });
    setSaving(false);
    if (!res.ok) return;
    setForm({ title: "", metric: "", baseline: "", target: "", current: "", notes: "" });
    setShowForm(false);
    load();
  }

  async function handleUpdateCurrent(goalId: string) {
    if (editCurrent === "") return;
    await fetch(`/api/admin/goals/${goalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current: Number(editCurrent) }),
    });
    setEditingId(null);
    setEditCurrent("");
    load();
  }

  async function handleToggleComplete(goal: GoalRow) {
    await fetch(`/api/admin/goals/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !goal.completedAt }),
    });
    load();
  }

  async function handleDelete(goalId: string) {
    await fetch(`/api/admin/goals/${goalId}`, { method: "DELETE" });
    load();
  }

  const active = goals.filter((g) => !g.completedAt);
  const completed = goals.filter((g) => g.completedAt);

  return (
    <div className={styles.goalCardMt}>
      <div className={styles.goalCardHeader}>
        <p className={styles.cardLabel}>Clinical goals ({goals.length})</p>
        <button type="button" onClick={() => setShowForm(!showForm)} className={styles.goalAddBtn}>
          + Add goal
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className={styles.goalForm}>
          <input
            required
            placeholder="Goal title (e.g. Improve focus score to 70)"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className={styles.goalFormInput}
          />
          <div className={styles.goalFormGrid3}>
            <input
              type="number" min="0" max="100"
              placeholder="Baseline (0–100)"
              value={form.baseline}
              onChange={(e) => setForm((p) => ({ ...p, baseline: e.target.value }))}
              className={styles.goalFormInput}
            />
            <input
              type="number" min="0" max="100"
              placeholder="Current (0–100)"
              value={form.current}
              onChange={(e) => setForm((p) => ({ ...p, current: e.target.value }))}
              className={styles.goalFormInput}
            />
            <input
              type="number" min="0" max="100"
              placeholder="Target (0–100)"
              value={form.target}
              onChange={(e) => setForm((p) => ({ ...p, target: e.target.value }))}
              className={styles.goalFormInput}
            />
          </div>
          <textarea
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            rows={2}
            className={styles.goalFormTextarea}
          />
          <div className={styles.goalFormActions}>
            <button type="submit" disabled={saving} className={styles.goalFormSubmit}>
              {saving ? "Saving…" : "Add goal"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className={styles.goalFormCancel}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className={styles.goalMutedText}>Loading…</p>
      ) : goals.length === 0 ? (
        <p className={styles.goalMutedText}>No goals set yet.</p>
      ) : (
        <div className={styles.goalList}>
          {active.map((goal) => (
            <div key={goal.id} className={styles.goalActiveItem}>
              <div className={styles.goalItemHeader}>
                <p className={styles.goalTitle}>{goal.title}</p>
                <div className={styles.goalItemActions}>
                  <button type="button" onClick={() => handleToggleComplete(goal)} title="Mark complete" className={styles.goalDoneBtn}>
                    ✓ Done
                  </button>
                  <button type="button" onClick={() => handleDelete(goal.id)} title="Delete goal" className={styles.goalDeleteBtn}>
                    ✕
                  </button>
                </div>
              </div>
              {(goal.baseline != null || goal.current != null || goal.target != null) && (
                <>
                  <GoalProgressBar baseline={goal.baseline} current={goal.current} target={goal.target} />
                  <p className={styles.goalStats}>
                    {goal.baseline != null && `Baseline: ${goal.baseline}`}
                    {goal.current != null && ` · Current: ${goal.current}`}
                    {goal.target != null && ` · Target: ${goal.target}`}
                  </p>
                </>
              )}
              {editingId === goal.id ? (
                <div className={styles.goalEditRow}>
                  <input
                    type="number" min="0" max="100"
                    value={editCurrent}
                    onChange={(e) => setEditCurrent(e.target.value)}
                    placeholder="New score"
                    className={styles.goalEditInput}
                    autoFocus
                  />
                  <button type="button" onClick={() => handleUpdateCurrent(goal.id)} className={styles.goalEditSave}>
                    Save
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className={styles.goalEditCancel}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setEditingId(goal.id); setEditCurrent(goal.current?.toString() ?? ""); }}
                  className={styles.goalUpdateLink}
                >
                  Update score
                </button>
              )}
              {goal.notes && <p className={styles.goalNotes}>{goal.notes}</p>}
            </div>
          ))}

          {completed.length > 0 && (
            <details className={styles.goalCompletedDetails}>
              <summary className={styles.goalCompletedSummary}>
                {completed.length} completed goal{completed.length !== 1 ? "s" : ""}
              </summary>
              <div className={styles.goalCompletedList}>
                {completed.map((goal) => (
                  <div key={goal.id} className={styles.goalCompletedItem}>
                    <div className={styles.goalCompletedHeader}>
                      <p className={styles.goalCompletedTitle}>{goal.title}</p>
                      <div className={styles.goalCompletedActions}>
                        <button type="button" onClick={() => handleToggleComplete(goal)} className={styles.goalCompletedBtn}>
                          Reopen
                        </button>
                        <button type="button" onClick={() => handleDelete(goal.id)} className={styles.goalCompletedBtn}>
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
