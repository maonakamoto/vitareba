"use client";

import { useState, useEffect } from "react";
import styles from "../../admin.module.css";
import authStyles from "../../../(auth)/auth.module.css";
import { BOOKING_STATUS_CONFIG, BOOKING_STATUS_VALUES, type BookingStatus } from "@/lib/config/booking-status";
import { formatDateShort, formatDateNumeric } from "@/lib/utils/format";

type Booking = {
  id: string;
  status: BookingStatus;
  preferredDate: string | null;
  notes: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
};


const FILTER_OPTIONS = ["all", ...BOOKING_STATUS_VALUES] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterOption>("pending");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/bookings");
    const data = await res.json();
    setBookings(data.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: BookingStatus) {
    setUpdating(id);
    setError("");
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!data.success) setError("Failed to update booking status.");
    setUpdating(null);
    load();
  }

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === (filter as BookingStatus));
  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <div>
      <h1 className={styles.pageTitle}>
        <em>Bookings</em>
      </h1>
      <p className={styles.pageSub}>
        {bookings.length} total · {pendingCount} pending
      </p>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.5rem" }}>
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            style={{
              padding: "0.4rem 0.9rem",
              border: "1px solid var(--border)",
              borderRadius: "2rem",
              background: filter === f ? "var(--ink)" : "transparent",
              color: filter === f ? "#fff" : "var(--ink2)",
              fontSize: "0.75rem",
              cursor: "pointer",
              textTransform: "capitalize",
              letterSpacing: "0.04em",
            }}
          >
            {f}{f === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      {error && <p style={{ fontSize: "0.8rem", color: "var(--danger)", marginBottom: "1rem" }}>{error}</p>}

      {loading ? (
        <div className={styles.emptyState}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>No {filter === "all" ? "" : filter} bookings.</div>
        </div>
      ) : (
        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Preferred date</th>
                <th>Notes</th>
                <th>Requested</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const s = BOOKING_STATUS_CONFIG[b.status] ?? BOOKING_STATUS_CONFIG.pending;
                const isUpdating = updating === b.id;
                return (
                  <tr key={b.id}>
                    <td>
                      <div style={{ fontWeight: 400, color: "var(--ink)" }}>
                        {b.user.name ?? <span style={{ color: "var(--muted)" }}>No name</span>}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{b.user.email}</div>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {b.preferredDate
                        ? formatDateShort(b.preferredDate)
                        : <span style={{ color: "var(--muted)" }}>—</span>}
                    </td>
                    <td style={{ maxWidth: "200px" }}>
                      {b.notes ? (
                        <span style={{ fontSize: "0.78rem", color: "var(--ink2)" }}>{b.notes}</span>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>—</span>
                      )}
                    </td>
                    <td style={{ whiteSpace: "nowrap", fontSize: "0.78rem", color: "var(--muted)" }}>
                      {formatDateNumeric(b.createdAt)}
                    </td>
                    <td>
                      <span className={styles.badge} style={{ color: s.color, background: s.bg }}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {b.status !== "confirmed" && (
                          <button
                            type="button"
                            onClick={() => updateStatus(b.id, "confirmed")}
                            disabled={isUpdating}
                            style={{
                              fontSize: "0.72rem", padding: "0.3rem 0.75rem",
                              background: "color-mix(in srgb, var(--teal) 12%, transparent)",
                              color: "var(--teal)", border: "1px solid color-mix(in srgb, var(--teal) 30%, transparent)",
                              borderRadius: "0.4rem", cursor: "pointer", opacity: isUpdating ? 0.5 : 1,
                            }}
                          >
                            Confirm
                          </button>
                        )}
                        {b.status !== "cancelled" && (
                          <button
                            type="button"
                            onClick={() => updateStatus(b.id, "cancelled")}
                            disabled={isUpdating}
                            style={{
                              fontSize: "0.72rem", padding: "0.3rem 0.75rem",
                              background: "color-mix(in srgb, var(--muted) 10%, transparent)",
                              color: "var(--muted)", border: "1px solid var(--border)",
                              borderRadius: "0.4rem", cursor: "pointer", opacity: isUpdating ? 0.5 : 1,
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
