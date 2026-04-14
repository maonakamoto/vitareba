"use client";

import { useState, useEffect } from "react";
import styles from "../portal.module.css";
import authStyles from "../../(auth)/auth.module.css";

type ProfileData = {
  name: string;
  phone: string;
  dateOfBirth: string;
  mainConcern: string;
  referralSource: string;
};

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileData>({
    name: "",
    phone: "",
    dateOfBirth: "",
    mainConcern: "",
    referralSource: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
        mainConcern: profile.data?.mainConcern ?? "",
        referralSource: profile.data?.referralSource ?? "",
      });
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function set(field: keyof ProfileData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  if (loading) return <div className={styles.emptyState}>Loading…</div>;

  return (
    <div style={{ maxWidth: "560px" }}>
      <h1 className={styles.pageTitle}>
        My <em>Profile</em>
      </h1>
      <p className={styles.pageSub}>Your personal information and preferences</p>

      <div className={styles.card}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div className={authStyles.field}>
            <label className={authStyles.label} htmlFor="name">Full name</label>
            <input id="name" className={authStyles.input} value={form.name} onChange={set("name")} />
          </div>
          <div className={authStyles.field}>
            <label className={authStyles.label} htmlFor="phone">Phone</label>
            <input id="phone" className={authStyles.input} type="tel" value={form.phone} onChange={set("phone")} placeholder="+41 79 000 00 00" />
          </div>
          <div className={authStyles.field}>
            <label className={authStyles.label} htmlFor="dob">Date of birth</label>
            <input id="dob" className={authStyles.input} type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} />
          </div>
          <div className={authStyles.field}>
            <label className={authStyles.label} htmlFor="concern">Main concern</label>
            <textarea
              id="concern"
              style={{ padding: "0.65rem 0.9rem", border: "1px solid var(--border)", borderRadius: "0.5rem", fontFamily: "inherit", fontSize: "0.9rem", resize: "vertical", minHeight: "80px" }}
              value={form.mainConcern}
              onChange={set("mainConcern")}
              placeholder="What brings you to VitaReBa?"
            />
          </div>
          <div className={authStyles.field}>
            <label className={authStyles.label} htmlFor="referral">How did you hear about us?</label>
            <input id="referral" className={authStyles.input} value={form.referralSource} onChange={set("referralSource")} placeholder="Referral, social media, search…" />
          </div>
          <button type="submit" className={authStyles.submit} disabled={saving}>
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
