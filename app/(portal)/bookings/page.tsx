"use client";

import { useState, useEffect } from "react";
import styles from "../portal.module.css";
import authStyles from "../../(auth)/auth.module.css";
import { BOOKING_STATUS_CONFIG, type BookingStatus } from "@/lib/config/booking-status";
import { formatDateLong, formatDateNumeric } from "@/lib/utils/format";

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL;

type Booking = {
  id: string;
  status: BookingStatus;
  preferredDate: string | null;
  notes: string | null;
  createdAt: string;
};


export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function load() {
    setLoadError(false);
    const res = await fetch("/api/bookings");
    if (!res.ok) { setLoading(false); setLoadError(true); return; }
    const data = await res.json();
    setBookings(data.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredDate, notes }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!data.success) {
      setSubmitError("Failed to submit booking. Please try again.");
      return;
    }
    setPreferredDate("");
    setNotes("");
    setShowForm(false);
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 5000);
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

      {/* Calendly shortcut */}
      {CALENDLY_URL && (
        <div style={{
          background: "color-mix(in srgb, var(--teal) 6%, transparent)",
          border: "1px solid color-mix(in srgb, var(--teal) 20%, transparent)",
          borderRadius: "0.875rem",
          padding: "1.25rem 1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}>
          <div>
            <p style={{ fontSize: "0.88rem", fontWeight: 500, color: "var(--ink)", margin: "0 0 0.2rem" }}>
              Book directly with Manuel
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: 0 }}>
              Pick a time — instant confirmation
            </p>
          </div>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-dark"
            style={{ padding: "0.6rem 1.25rem", fontSize: "0.75rem", textDecoration: "none", whiteSpace: "nowrap" }}
          >
            Book on Calendly →
          </a>
        </div>
      )}

      {submitSuccess && (
        <div style={{ background: "color-mix(in srgb, var(--teal) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--teal) 25%, transparent)", borderRadius: "0.75rem", padding: "1rem 1.5rem", marginBottom: "1.25rem", fontSize: "0.85rem", color: "var(--teal)" }}>
          Booking request submitted. Manuel will be in touch to confirm.
        </div>
      )}

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
            {submitError && <p style={{ fontSize: "0.75rem", color: "var(--danger)" }}>{submitError}</p>}
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
      ) : loadError ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>
            Could not load bookings.{" "}
            <button onClick={load} style={{ color: "var(--teal)", background: "none", border: "none", cursor: "pointer", fontSize: "inherit", padding: 0 }}>
              Retry
            </button>
          </div>
        </div>
      ) : bookings.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>No bookings yet. Request your first consultation above.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {bookings.map((b) => {
            const s = BOOKING_STATUS_CONFIG[b.status] ?? BOOKING_STATUS_CONFIG.pending;
            return (
              <div key={b.id} className={styles.card} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontSize: "0.85rem", color: "var(--ink)", marginBottom: "0.35rem" }}>
                    {b.preferredDate ? `Preferred: ${formatDateLong(b.preferredDate)}` : "No preferred date"}
                  </p>
                  {b.notes && <p style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{b.notes}</p>}
                  <p style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.5rem" }}>
                    Requested {formatDateNumeric(b.createdAt)}
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
