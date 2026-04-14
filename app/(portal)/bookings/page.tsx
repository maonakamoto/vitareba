"use client";

import { useState, useEffect } from "react";
import styles from "../portal.module.css";
import authStyles from "../../(auth)/auth.module.css";

type Booking = {
  id: string;
  status: "pending" | "confirmed" | "cancelled";
  preferredDate: string | null;
  notes: string | null;
  createdAt: string;
};

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  pending: { color: "var(--warn)", bg: "color-mix(in srgb, var(--warn) 10%, transparent)" },
  confirmed: { color: "var(--teal)", bg: "color-mix(in srgb, var(--teal) 10%, transparent)" },
  cancelled: { color: "var(--muted)", bg: "color-mix(in srgb, var(--muted) 10%, transparent)" },
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const res = await fetch("/api/bookings");
    const data = await res.json();
    setBookings(data.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredDate, notes }),
    });
    setPreferredDate("");
    setNotes("");
    setShowForm(false);
    setSubmitting(false);
    load();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 className={styles.pageTitle}>
            My <em>Bookings</em>
          </h1>
          <p className={styles.pageSub}>Consultation requests and appointments</p>
        </div>
        <button type="button" className={authStyles.submit} style={{ marginTop: 0, width: "auto" }} onClick={() => setShowForm(!showForm)}>
          + Request booking
        </button>
      </div>

      {showForm && (
        <div className={styles.card} style={{ marginBottom: "1.5rem" }}>
          <p className={styles.cardTitle}>New booking request</p>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="date">Preferred date (optional)</label>
              <input id="date" className={authStyles.input} type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
            </div>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                style={{ padding: "0.65rem 0.9rem", border: "1px solid var(--border)", borderRadius: "0.5rem", fontFamily: "inherit", fontSize: "0.9rem", resize: "vertical", minHeight: "80px" }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What would you like to discuss?"
              />
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit" className={authStyles.submit} style={{ marginTop: 0, flex: 1 }} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit request"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: "0.75rem", border: "1px solid var(--border)", borderRadius: "0.5rem", background: "none", cursor: "pointer", fontSize: "0.8rem" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className={styles.emptyState}>Loading…</div>
      ) : bookings.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>No bookings yet. Request your first consultation above.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {bookings.map((b) => {
            const s = STATUS_STYLES[b.status] ?? STATUS_STYLES.pending;
            return (
              <div key={b.id} className={styles.card} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontSize: "0.85rem", color: "var(--ink)", marginBottom: "0.35rem" }}>
                    {b.preferredDate ? `Preferred: ${new Date(b.preferredDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}` : "No preferred date"}
                  </p>
                  {b.notes && <p style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{b.notes}</p>}
                  <p style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.5rem" }}>
                    Requested {new Date(b.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", padding: "0.3rem 0.75rem", borderRadius: "1rem", color: s.color, background: s.bg, whiteSpace: "nowrap" }}>
                  {b.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
