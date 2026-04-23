"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../portal.module.css";
import checkinStyles from "./checkin.module.css";
import { CheckinTrendChart } from "@/components/portal/CheckinTrendChart";
import { CHECKIN_SCALE_MIN, CHECKIN_SCALE_MAX, SAVED_FEEDBACK_MS, CHECKIN_METRICS, type MetricKey } from "@/lib/config/portal";
import { PORTAL_ROUTES } from "@/lib/config/routes";
import { formatDateISO, formatDateMonthDay } from "@/lib/utils/format";
import { COMPANY } from "@/lib/config/company";
import { computeStreak } from "@/lib/domain/checkin";


type CheckinData = { date: string; notes: string } & Record<MetricKey, number>;

type StoredCheckin = Omit<CheckinData, "notes"> & { notes: string | null; id: string };


function streakMessage(streak: number): string {
  if (streak >= 30) return "30-day streak — elite consistency. You're in rare company.";
  if (streak >= 14) return `${streak}-day streak — two weeks of real data. Your trend is now meaningful.`;
  if (streak >= 7) return `${streak}-day streak — a full week. Your nervous system is being mapped.`;
  if (streak >= 3) return `${streak} days in a row. Patterns are already forming.`;
  if (streak === 2) return "2 days running. Keep it going.";
  return "First data point saved. Come back tomorrow to start your streak.";
}


const SCALE = Array.from(
  { length: CHECKIN_SCALE_MAX - CHECKIN_SCALE_MIN + 1 },
  (_, i) => i + CHECKIN_SCALE_MIN
);

function todayISO() {
  return formatDateISO(new Date());
}

export default function CheckinPage() {
  const today = todayISO();

  const [form, setForm] = useState<CheckinData>({
    date: today,
    sleep: 0,
    energy: 0,
    mood: 0,
    focus: 0,
    stress: 0,
    notes: "",
  });
  const [history, setHistory] = useState<StoredCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const alreadyCheckedIn = history.some((c) => c.date === today) && !saving;

  useEffect(() => {
    fetch("/api/checkin")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setHistory(res.data.checkins);
          if (res.data.todayCheckin) {
            const tc = res.data.todayCheckin;
            setForm({
              date: tc.date,
              sleep: tc.sleep,
              energy: tc.energy,
              mood: tc.mood,
              focus: tc.focus,
              stress: tc.stress,
              notes: tc.notes ?? "",
            });
          }
        }
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (CHECKIN_METRICS.some(({ key }) => form[key] === 0)) return; // all metrics required
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setSaveError("Failed to save check-in. Please try again.");
        return;
      }
      setSaved(true);
      setHistory((prev) => {
        const without = prev.filter((c) => c.date !== today);
        const updated: StoredCheckin = { id: "", ...form, notes: form.notes || null };
        return [...without, updated].sort((a, b) => a.date.localeCompare(b.date));
      });
      setTimeout(() => setSaved(false), SAVED_FEEDBACK_MS);
    } catch {
      setSaveError("Failed to save check-in. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function setMetric(key: MetricKey, value: number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const chartData = history.map((c) => ({
    date: formatDateMonthDay(c.date + "T00:00:00"),
    ...Object.fromEntries(CHECKIN_METRICS.map(({ key }) => [key, c[key]])) as Record<MetricKey, number>,
  }));

  const allFilled = CHECKIN_METRICS.every(({ key }) => form[key] > 0);
  const streak = computeStreak(history);

  if (loading) return <div className={styles.emptyState}>Loading…</div>;
  if (loadError) return <div className={styles.emptyState}>Failed to load your check-in history. Please refresh the page.</div>;

  return (
    <div>
      <h1 className={styles.pageTitle}>
        Daily <em>Check-in</em>
      </h1>
      <p className={styles.pageSub}>Track your wellbeing — takes 30 seconds</p>

      <div className={checkinStyles.layout}>
        {/* Post-save success panel */}
        {saved && (
          <div className={checkinStyles.successPanel}>
            <div className={checkinStyles.successTop}>
              <span className={checkinStyles.successCheck}>✓</span>
              <div>
                <p className={checkinStyles.successTitle}>Check-in saved</p>
                <p className={checkinStyles.successStreak}>{streakMessage(streak)}</p>
              </div>
            </div>
            <p className={checkinStyles.successBody}>
              Each data point refines your pattern. {COMPANY.clinicianName} reviews your trend before every consultation — this is the raw material of your programme.
            </p>
            <div className={checkinStyles.successLinks}>
              <Link href={PORTAL_ROUTES.dashboard} className={checkinStyles.successLinkPrimary}>Back to dashboard →</Link>
              <Link href={PORTAL_ROUTES.assessments} className={checkinStyles.successLinkMuted}>View full results</Link>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.card}>
          <p className={styles.cardTitle}>
            {alreadyCheckedIn ? "Today's check-in — update" : "Today's check-in"}
          </p>
          {streak >= 2 && !saved && (
            <p className={checkinStyles.streakBadge}>🔥 {streak}-day streak</p>
          )}

          <div className={checkinStyles.metrics}>
            {CHECKIN_METRICS.map(({ key, label, lowLabel, highLabel }) => (
              <div key={key} className={checkinStyles.metricRow}>
                <div className={checkinStyles.metricLabel}>{label}</div>
                <div className={checkinStyles.scaleWrap}>
                  <span className={checkinStyles.scaleEdge}>{lowLabel}</span>
                  <div className={checkinStyles.buttons}>
                    {SCALE.map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={`${checkinStyles.scaleBtn} ${form[key] === v ? checkinStyles.scaleBtnActive : ""}`}
                        onClick={() => setMetric(key, v)}
                        aria-label={`${label}: ${v}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <span className={checkinStyles.scaleEdge}>{highLabel}</span>
                </div>
              </div>
            ))}
          </div>

          <div className={checkinStyles.notesField}>
            <label className={checkinStyles.notesLabel} htmlFor="checkin-notes">
              Notes <span className={checkinStyles.optional}>(optional)</span>
            </label>
            <textarea
              id="checkin-notes"
              className={checkinStyles.notesTextarea}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Anything worth noting today?"
            />
          </div>

          {saveError && <p className={styles.formErrorTop}>{saveError}</p>}
          <button
            type="submit"
            className={checkinStyles.submitBtn}
            disabled={saving || !allFilled}
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : alreadyCheckedIn ? "Update check-in" : "Save check-in"}
          </button>
        </form>

        {/* History chart */}
        {history.length > 1 && (
          <div className={styles.card}>
            <p className={styles.cardTitle}>Trend — last {history.length} days</p>
            <CheckinTrendChart data={chartData} />
          </div>
        )}

        {history.length === 0 && !loading && (
          <div className={styles.card}>
            <div className={styles.emptyState}>
              Complete your first check-in to start tracking your trend.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
