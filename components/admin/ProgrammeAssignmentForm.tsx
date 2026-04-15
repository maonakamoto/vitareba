"use client";

import { useState } from "react";
import { SAVED_FEEDBACK_MS } from "@/lib/config/portal";
import { PROGRAMME_CONFIG, PHASE_CONFIG, PROGRAMME_ENUM_VALUES, PHASE_ENUM_VALUES } from "@/lib/config/programmes";
import type { ProgrammeKey, PhaseKey } from "@/lib/config/programmes";

type Assignment = {
  programme: ProgrammeKey;
  phase: PhaseKey;
  startDate: string | null;
  notes: string | null;
};

export function ProgrammeAssignmentForm({
  patientId,
  initial,
}: {
  patientId: string;
  initial: Assignment | null;
}) {
  const [programme, setProgramme] = useState<ProgrammeKey | "">(initial?.programme ?? "");
  const [phase, setPhase] = useState<PhaseKey | "">(initial?.phase ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!programme || !phase) return;
    setSaving(true);
    setError("");

    const res = await fetch(`/api/admin/patients/${patientId}/programme`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programme,
        phase,
        startDate: startDate || null,
        notes: notes || null,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!data.success) {
      setError("Failed to save assignment.");
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), SAVED_FEEDBACK_MS);
  }

  const fieldStyle = {
    padding: "0.55rem 0.85rem",
    border: "1px solid var(--border)",
    borderRadius: "0.5rem",
    fontFamily: "inherit",
    fontSize: "0.85rem",
    width: "100%",
    boxSizing: "border-box" as const,
    background: "#fff",
  };

  const labelStyle = {
    fontSize: "0.72rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "var(--muted)",
    display: "block",
    marginBottom: "0.35rem",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label style={labelStyle}>Programme</label>
          <select
            value={programme}
            onChange={(e) => setProgramme(e.target.value as ProgrammeKey)}
            style={fieldStyle}
          >
            <option value="">Select programme…</option>
            {PROGRAMME_ENUM_VALUES.map((key) => (
              <option key={key} value={key}>{PROGRAMME_CONFIG[key].label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Phase</label>
          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value as PhaseKey)}
            style={fieldStyle}
          >
            <option value="">Select phase…</option>
            {PHASE_ENUM_VALUES.map((key) => (
              <option key={key} value={key}>{PHASE_CONFIG[key].label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Start date (optional)</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={fieldStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Any notes about this assignment…"
          style={{ ...fieldStyle, resize: "vertical" }}
        />
      </div>

      {programme && phase && (
        <div style={{ background: "var(--off)", borderRadius: "0.5rem", padding: "0.75rem 1rem", fontSize: "0.78rem", color: "var(--ink2)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--ink)" }}>{PROGRAMME_CONFIG[programme as ProgrammeKey]?.label}</strong>
          {" — "}
          {PHASE_CONFIG[phase as PhaseKey]?.description}
        </div>
      )}

      {error && <p style={{ fontSize: "0.75rem", color: "var(--danger)", margin: 0 }}>{error}</p>}

      <button
        type="submit"
        disabled={saving || !programme || !phase}
        style={{
          alignSelf: "flex-start",
          padding: "0.5rem 1.25rem",
          background: "var(--ink)",
          color: "#fff",
          border: "none",
          borderRadius: "0.5rem",
          fontSize: "0.78rem",
          letterSpacing: "0.05em",
          cursor: saving || !programme || !phase ? "not-allowed" : "pointer",
          opacity: saving || !programme || !phase ? 0.6 : 1,
        }}
      >
        {saving ? "Saving…" : saved ? "Saved ✓" : initial ? "Update assignment" : "Assign programme"}
      </button>
    </form>
  );
}
