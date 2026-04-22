"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../../admin.module.css";
import { BOOKING_STATUS, BOOKING_STATUS_CONFIG, BOOKING_STATUS_VALUES, type BookingRowWithUser, type BookingStatus } from "@/lib/config/booking-status";
import { formatDateShort, formatDateNumeric } from "@/lib/utils/format";


const FILTER_OPTIONS = ["all", ...BOOKING_STATUS_VALUES] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRowWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterOption>(BOOKING_STATUS.pending);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/bookings");
    const data = await res.json();
    setBookings(data.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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
  const pendingCount = bookings.filter((b) => b.status === BOOKING_STATUS.pending).length;

  return (
    <div>
      <h1 className={styles.pageTitle}>
        <em>Bookings</em>
      </h1>
      <p className={styles.pageSub}>
        {bookings.length} total · {pendingCount} pending
      </p>

      <div className={styles.filterBar}>
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`${styles.filterTab}${filter === f ? ` ${styles.filterTabActive}` : ""}`}
          >
            {f}{f === BOOKING_STATUS.pending && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      {error && <p className={styles.formErrorMb}>{error}</p>}

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
                      <div className={styles.cellName}>
                        {b.user.name ?? <span className={styles.cellMuted}>No name</span>}
                      </div>
                      <div className={styles.cellSub}>{b.user.email}</div>
                    </td>
                    <td className={styles.cellNowrap}>
                      {b.preferredDate
                        ? formatDateShort(b.preferredDate)
                        : <span className={styles.cellMuted}>—</span>}
                    </td>
                    <td className={styles.tdNotes}>
                      {b.notes ? (
                        <span className={styles.cellTextAlt}>{b.notes}</span>
                      ) : (
                        <span className={styles.cellMuted}>—</span>
                      )}
                    </td>
                    <td className={styles.cellNowrap}>
                      {formatDateNumeric(b.createdAt)}
                    </td>
                    <td>
                      <span className={styles.badge} style={{ color: s.color, background: s.bg }}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionGroup}>
                        {b.status !== BOOKING_STATUS.confirmed && (
                          <button
                            type="button"
                            onClick={() => updateStatus(b.id, BOOKING_STATUS.confirmed)}
                            disabled={isUpdating}
                            className={styles.actionBtnConfirm}
                          >
                            Confirm
                          </button>
                        )}
                        {b.status !== BOOKING_STATUS.cancelled && (
                          <button
                            type="button"
                            onClick={() => updateStatus(b.id, BOOKING_STATUS.cancelled)}
                            disabled={isUpdating}
                            className={styles.actionBtnCancel}
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
