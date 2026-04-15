"use client";

import { useState, useEffect } from "react";
import styles from "@/app/(admin)/admin.module.css";

type Goal = {
  id: string;
  title: string;
  metric: string | null;
  baseline: number | null;
  target: number | null;
  current: number | null;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
};

function GoalProgressBar({ baseline, current, target }: { baseline: number | null; current: number | null; target: number | null }) {
  if (current == null && target == null) return null;
  const max = Math.max(target ?? 0, current ?? 0, baseline ?? 0, 100);
  const baselinePct = baseline != null ? (baseline / max) * 100 : null;
  const currentPct = current != null ? (current / max) * 100 : null;
  const targetPct = target != null ? (target / max) * 100 : null;

  return (
    <div style={{ position: "relative", height: "6px", background: "var(--border)", borderRadius: "3px", margin: "0.5rem 0", overflow: "visible" }}>
      {/* Fill from baseline to current */}
      {currentPct != null && (
        <div style={{
          position: "absolute",
          left: `${baselinePct ?? 0}%`,
          width: `${Math.max(0, currentPct - (baselinePct ?? 0))}%`,
          height: "100%",
          background: "var(--teal)",
          borderRadius: "3px",
          transition: "width 0.3s",
        }} />
      )}
      {/* Target marker */}
      {targetPct != null && (
        <div style={{
          position: "absolute",
          left: `${targetPct}%`,
          top: "-3px",
          width: "2px",
          height: "12px",
          background: "var(--gold)",
          borderRadius: "1px",
          transform: "translateX(-50%)",
        }} />
      )}
    </div>
  );
}

export function PatientGoalsCard({ patientId }: { patientId: string }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", metric: "", baseline: "", target: "", current: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCurrent, setEditCurrent] = useState("");

  async function load() {
    const res = await fetch(`/api/admin/patients/${patientId}/goals`);
    if (!res.ok) return;
    const data = await res.json();
    setGoals(data.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [patientId]);

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

  async function handleToggleComplete(goal: Goal) {
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
    <div className={styles.card} style={{ marginTop: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <p className={styles.cardLabel}>Clinical goals ({goals.length})</p>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          style={{ fontSize: "0.75rem", color: "var(--teal)", background: "none", border: "1px solid color-mix(in srgb, var(--teal) 30%, transparent)", borderRadius: "0.4rem", padding: "0.3rem 0.75rem", cursor: "pointer" }}
        >
          + Add goal
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} style={{ marginBottom: "1.25rem", display: "flex", flexDirection: "column", gap: "0.65rem", background: "var(--off)", borderRadius: "0.5rem", padding: "1rem" }}>
          <input
            required
            placeholder="Goal title (e.g. Improve focus score to 70)"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border)", borderRadius: "0.4rem", fontSize: "0.82rem", fontFamily: "inherit" }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Baseline (0–100)"
              value={form.baseline}
              onChange={(e) => setForm((p) => ({ ...p, baseline: e.target.value }))}
              style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border)", borderRadius: "0.4rem", fontSize: "0.82rem", fontFamily: "inherit" }}
            />
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Current (0–100)"
              value={form.current}
              onChange={(e) => setForm((p) => ({ ...p, current: e.target.value }))}
              style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border)", borderRadius: "0.4rem", fontSize: "0.82rem", fontFamily: "inherit" }}
            />
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Target (0–100)"
              value={form.target}
              onChange={(e) => setForm((p) => ({ ...p, target: e.target.value }))}
              style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border)", borderRadius: "0.4rem", fontSize: "0.82rem", fontFamily: "inherit" }}
            />
          </div>
          <textarea
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            rows={2}
            style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border)", borderRadius: "0.4rem", fontSize: "0.82rem", fontFamily: "inherit", resize: "vertical" }}
          />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: "0.5rem", background: "var(--ink)", color: "#fff", border: "none", borderRadius: "0.4rem", fontSize: "0.8rem", cursor: "pointer" }}>
              {saving ? "Saving…" : "Add goal"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: "0.5rem", background: "none", border: "1px solid var(--border)", borderRadius: "0.4rem", fontSize: "0.8rem", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ fontSize: "0.82rem", color: "var(--muted)" }}>Loading…</p>
      ) : goals.length === 0 ? (
        <p style={{ fontSize: "0.82rem", color: "var(--muted)" }}>No goals set yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {active.map((goal) => (
            <div key={goal.id} style={{ borderLeft: "3px solid var(--teal)", paddingLeft: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                <p style={{ fontSize: "0.85rem", color: "var(--ink)", fontWeight: 500, margin: 0 }}>{goal.title}</p>
                <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(goal)}
                    title="Mark complete"
                    style={{ fontSize: "0.7rem", color: "var(--teal)", background: "none", border: "1px solid color-mix(in srgb, var(--teal) 25%, transparent)", borderRadius: "0.3rem", padding: "0.2rem 0.5rem", cursor: "pointer" }}
                  >
                    ✓ Done
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(goal.id)}
                    title="Delete goal"
                    style={{ fontSize: "0.7rem", color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: "0.2rem" }}
                  >
                    ✕
                  </button>
                </div>
              </div>
              {(goal.baseline != null || goal.current != null || goal.target != null) && (
                <>
                  <GoalProgressBar baseline={goal.baseline} current={goal.current} target={goal.target} />
                  <p style={{ fontSize: "0.72rem", color: "var(--muted)", margin: "0.2rem 0 0" }}>
                    {goal.baseline != null && `Baseline: ${goal.baseline}`}
                    {goal.current != null && ` · Current: ${goal.current}`}
                    {goal.target != null && ` · Target: ${goal.target}`}
                  </p>
                </>
              )}
              {/* Inline current score update */}
              {editingId === goal.id ? (
                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.4rem", alignItems: "center" }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editCurrent}
                    onChange={(e) => setEditCurrent(e.target.value)}
                    placeholder="New score"
                    style={{ width: "80px", padding: "0.3rem 0.5rem", border: "1px solid var(--border)", borderRadius: "0.3rem", fontSize: "0.78rem", fontFamily: "inherit" }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateCurrent(goal.id)}
                    style={{ fontSize: "0.72rem", color: "#fff", background: "var(--teal)", border: "none", borderRadius: "0.3rem", padding: "0.3rem 0.6rem", cursor: "pointer" }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    style={{ fontSize: "0.72rem", color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setEditingId(goal.id); setEditCurrent(goal.current?.toString() ?? ""); }}
                  style={{ fontSize: "0.72rem", color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: "0.25rem", textDecoration: "underline" }}
                >
                  Update score
                </button>
              )}
              {goal.notes && <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "0.3rem 0 0" }}>{goal.notes}</p>}
            </div>
          ))}

          {completed.length > 0 && (
            <details style={{ marginTop: "0.5rem" }}>
              <summary style={{ fontSize: "0.78rem", color: "var(--muted)", cursor: "pointer", listStyle: "none" }}>
                {completed.length} completed goal{completed.length !== 1 ? "s" : ""}
              </summary>
              <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {completed.map((goal) => (
                  <div key={goal.id} style={{ borderLeft: "3px solid var(--border)", paddingLeft: "0.75rem", opacity: 0.7 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <p style={{ fontSize: "0.82rem", color: "var(--ink2)", margin: 0, textDecoration: "line-through" }}>{goal.title}</p>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(goal)}
                          style={{ fontSize: "0.68rem", color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}
                        >
                          Reopen
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(goal.id)}
                          style={{ fontSize: "0.68rem", color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}
                        >
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
