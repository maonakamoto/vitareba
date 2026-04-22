"use client";

import { useState, useEffect } from "react";
import styles from "../portal.module.css";
import profileStyles from "./profile.module.css";
import authStyles from "../../(auth)/auth.module.css";
import {
  SAVED_FEEDBACK_MS,
  EXERCISE_FREQUENCY_OPTIONS,
  SLEEP_HOURS_MIN,
  SLEEP_HOURS_MAX,
} from "@/lib/config/portal";
import type { ExerciseFrequency } from "@/lib/config/portal";
import { computeProfileCompleteness } from "@/lib/domain/profile";
import { COMPANY } from "@/lib/config/company";

type ProfileData = {
  name: string;
  phone: string;
  dateOfBirth: string;
  city: string;
  occupation: string;
  mainConcern: string;
  goals: string;
  diagnosisHistory: string;
  currentMedications: string;
  currentSupplements: string;
  sleepHoursAvg: number | "";
  exerciseFrequency: ExerciseFrequency | "";
  referralSource: string;
  notes: string;
  digestOptOut: boolean;
};

const EMPTY_FORM: ProfileData = {
  name: "",
  phone: "",
  dateOfBirth: "",
  city: "",
  occupation: "",
  mainConcern: "",
  goals: "",
  diagnosisHistory: "",
  currentMedications: "",
  currentSupplements: "",
  sleepHoursAvg: "",
  exerciseFrequency: "",
  referralSource: "",
  notes: "",
  digestOptOut: false,
};

export function ProfileForm() {
  const [form, setForm] = useState<ProfileData>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    async function load() {
      const [profileRes, sessionRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/auth/session"),
      ]);
      const profile = await profileRes.json();
      const session = await sessionRes.json();
      setForm({
        name: session?.user?.name ?? "",
        phone: profile.data?.phone ?? "",
        dateOfBirth: profile.data?.dateOfBirth ?? "",
        city: profile.data?.city ?? "",
        occupation: profile.data?.occupation ?? "",
        mainConcern: profile.data?.mainConcern ?? "",
        goals: profile.data?.goals ?? "",
        diagnosisHistory: profile.data?.diagnosisHistory ?? "",
        currentMedications: profile.data?.currentMedications ?? "",
        currentSupplements: profile.data?.currentSupplements ?? "",
        sleepHoursAvg: profile.data?.sleepHoursAvg ?? "",
        exerciseFrequency: profile.data?.exerciseFrequency ?? "",
        referralSource: profile.data?.referralSource ?? "",
        notes: profile.data?.notes ?? "",
        digestOptOut: profile.data?.digestOptOut ?? false,
      });
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        sleepHoursAvg: form.sleepHoursAvg === "" ? null : Number(form.sleepHoursAvg),
        exerciseFrequency: form.exerciseFrequency === "" ? null : form.exerciseFrequency,
        digestOptOut: form.digestOptOut,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.success) {
      setSaveError("Failed to save changes. Please try again.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), SAVED_FEEDBACK_MS);
  }

  function set(field: keyof ProfileData) {
    return (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  if (loading) return <div className={styles.emptyState}>Loading…</div>;

  const pct = computeProfileCompleteness(form as Record<string, unknown>);

  return (
    <>
      {/* Completeness indicator */}
      <div className={profileStyles.completenessCard}>
        <div className={profileStyles.completenessHeader}>
          <span className={profileStyles.completenessLabel}>Profile completeness</span>
          <span className={profileStyles.completenessValue}>{pct}%</span>
        </div>
        <div className={profileStyles.progressTrack}>
          <div className={profileStyles.progressFill} style={{ width: `${pct}%` }} />
        </div>
        {pct < 100 && (
          <p className={profileStyles.completenessHint}>
            A complete profile helps {COMPANY.clinicianName} personalise your programme and provide
            24/7 tailored support.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className={profileStyles.form}>

        {/* ── Personal ──────────────────────────────────────────────── */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Personal</p>
          <div className={profileStyles.fieldGrid}>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="name">Full name</label>
              <input id="name" className={authStyles.input} value={form.name} onChange={set("name")} />
            </div>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="dob">Date of birth</label>
              <input id="dob" className={authStyles.input} type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} />
            </div>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="phone">Phone</label>
              <input id="phone" className={authStyles.input} type="tel" value={form.phone} onChange={set("phone")} placeholder="+41 79 000 00 00" />
            </div>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="city">City</label>
              <input id="city" className={authStyles.input} value={form.city} onChange={set("city")} placeholder="Zürich" />
            </div>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="occupation">Occupation</label>
              <input id="occupation" className={authStyles.input} value={form.occupation} onChange={set("occupation")} placeholder="Founder, engineer, executive…" />
            </div>
          </div>
        </div>

        {/* ── Clinical context ──────────────────────────────────────── */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Clinical context</p>
          <div className={profileStyles.fieldStack}>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="concern">Main concern</label>
              <textarea id="concern" className={profileStyles.textarea} value={form.mainConcern} onChange={set("mainConcern")} placeholder="What brings you to VitaReBa?" />
            </div>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="goals">Goals</label>
              <textarea id="goals" className={profileStyles.textarea} value={form.goals} onChange={set("goals")} placeholder="What would success look like in 6 months?" />
            </div>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="diagnosis">Diagnosis history</label>
              <textarea id="diagnosis" className={profileStyles.textarea} value={form.diagnosisHistory} onChange={set("diagnosisHistory")} placeholder="Any prior diagnoses (ADHD, anxiety, depression, etc.)" />
            </div>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="meds">Current medications</label>
              <textarea id="meds" className={profileStyles.textarea} value={form.currentMedications} onChange={set("currentMedications")} placeholder="Name, dose, frequency — or 'none'" />
            </div>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="supps">Current supplements</label>
              <textarea id="supps" className={profileStyles.textarea} value={form.currentSupplements} onChange={set("currentSupplements")} placeholder="Omega-3, magnesium, creatine…" />
            </div>
          </div>
        </div>

        {/* ── Lifestyle baseline ────────────────────────────────────── */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Lifestyle baseline</p>
          <div className={profileStyles.fieldGrid}>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="sleep">Average sleep (hours/night)</label>
              <input
                id="sleep"
                className={authStyles.input}
                type="number"
                min={SLEEP_HOURS_MIN}
                max={SLEEP_HOURS_MAX}
                value={form.sleepHoursAvg}
                onChange={set("sleepHoursAvg")}
                placeholder="7"
              />
            </div>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="exercise">Exercise frequency</label>
              <select id="exercise" className={authStyles.input} value={form.exerciseFrequency} onChange={set("exerciseFrequency")}>
                <option value="">Select…</option>
                {EXERCISE_FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Notes ────────────────────────────────────────────────── */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Notes for {COMPANY.clinicianName}</p>
          <div className={authStyles.field}>
            <textarea
              id="notes"
              className={profileStyles.textareaLg}
              value={form.notes}
              onChange={set("notes")}
              placeholder={`Anything else you'd like ${COMPANY.clinicianName} to know before your first consultation…`}
            />
          </div>
        </div>

        {/* ── How did you hear ─────────────────────────────────────── */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>How did you find VitaReBa?</p>
          <div className={authStyles.field}>
            <input id="referral" className={authStyles.input} value={form.referralSource} onChange={set("referralSource")} placeholder="Referral, social media, search…" />
          </div>
        </div>

        {/* ── Email preferences ─────────────────────────────────────── */}
        <div className={styles.card} id="digest-optout">
          <p className={styles.cardTitle}>Email preferences</p>
          <label className={profileStyles.checkboxRow}>
            <input
              type="checkbox"
              className={profileStyles.checkboxInput}
              checked={form.digestOptOut}
              onChange={(e) => setForm((prev) => ({ ...prev, digestOptOut: e.target.checked }))}
            />
            Opt out of weekly summary emails
          </label>
          <p className={profileStyles.checkboxHint}>
            Weekly summaries include your check-in averages, latest score, and booking status. Uncheck to receive them.
          </p>
        </div>

        {saveError && <p className={styles.formError}>{saveError}</p>}
        <button type="submit" className={authStyles.submit} disabled={saving}>
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
        </button>
      </form>
    </>
  );
}
