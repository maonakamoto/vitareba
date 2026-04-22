"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../portal.module.css";
import bookingStyles from "./bookings.module.css";
import authStyles from "../../(auth)/auth.module.css";
import { BOOKING_STATUS_CONFIG, type BookingStatus } from "@/lib/config/booking-status";
import { formatDateLong, formatDateNumeric } from "@/lib/utils/format";
import { COMPANY } from "@/lib/config/company";

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

  const load = useCallback(async () => {
    setLoadError(false);
    const res = await fetch("/api/bookings");
    if (!res.ok) { setLoading(false); setLoadError(true); return; }
    const data = await res.json();
    setBookings(data.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            My <em>Bookings</em>
          </h1>
          <p className={styles.pageSub}>Consultation requests and appointments</p>
        </div>
        <button type="button" className={`${authStyles.submit} ${styles.headerBtn}`} onClick={() => setShowForm(!showForm)}>
          + Request booking
        </button>
      </div>

      {/* Calendly shortcut */}
      {CALENDLY_URL && (
        <div className={bookingStyles.calendlyBanner}>
          <div>
            <p className={bookingStyles.calendlyBannerTitle}>
              Book directly with {COMPANY.clinicianName}
            </p>
            <p className={bookingStyles.calendlyBannerSub}>
              Pick a time — instant confirmation
            </p>
          </div>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn-dark ${styles.ctaBtnSmall}`}
          >
            Book on Calendly →
          </a>
        </div>
      )}

      {submitSuccess && (
        <div className={bookingStyles.successBanner}>
          <p className={bookingStyles.bannerTitle}>Booking request submitted</p>
          <p>{COMPANY.clinicianName} reviews all requests personally and will be in touch within 24 hours to confirm your appointment.</p>
        </div>
      )}

      {showForm && (
        <div className={`${styles.card} ${styles.cardGap}`}>
          <p className={styles.cardTitle}>Request a consultation</p>
          <p className={styles.formHint}>
            {COMPANY.clinicianName} reviews every request personally. Include anything that helps him prepare — your Inflection Edge scores are already on file.
          </p>
          <form onSubmit={handleSubmit} className={styles.formStack}>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="date">Preferred date (optional)</label>
              <input id="date" className={authStyles.input} type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
            </div>
            <div className={authStyles.field}>
              <label className={authStyles.label} htmlFor="notes">What would you like to focus on?</label>
              <textarea
                id="notes"
                className={styles.formTextarea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. I want to understand my ADHD diagnosis and what a programme could look like for me…"
              />
            </div>
            {submitError && <p className={styles.formError}>{submitError}</p>}
            <div className={styles.formActions}>
              <button type="submit" className={`${authStyles.submit} ${styles.formActionPrimary}`} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit request"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className={styles.cancelBtn}>
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
            <button onClick={load} className={styles.retryBtn}>
              Retry
            </button>
          </div>
        </div>
      ) : bookings.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>No bookings yet</p>
            <p>A discovery call is the fastest way to find out if VitaReBa is right for you — 30 minutes with {COMPANY.clinicianName} to look at your Inflection Edge results and map out a programme.</p>
          </div>
        </div>
      ) : (
        <div className={styles.listStack}>
          {bookings.map((b) => {
            const s = BOOKING_STATUS_CONFIG[b.status] ?? BOOKING_STATUS_CONFIG.pending;
            return (
              <div key={b.id} className={styles.card}>
                <div className={bookingStyles.bookingItem}>
                  <div className={bookingStyles.bookingItemInfo}>
                    <p className={bookingStyles.bookingItemDate}>
                      {b.preferredDate ? `Preferred: ${formatDateLong(b.preferredDate)}` : "No preferred date"}
                    </p>
                    {b.notes && <p className={bookingStyles.bookingNotes}>{b.notes}</p>}
                    <p className={bookingStyles.bookingRequested}>
                      Requested {formatDateNumeric(b.createdAt)}
                    </p>
                  </div>
                  <span
                    className={bookingStyles.bookingBadge}
                    style={{ color: s.color, background: s.bg }}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
