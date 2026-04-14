"use client";

import { useState, useEffect } from "react";
import styles from "../../admin.module.css";

type Booking = {
  id: string;
  status: "pending" | "confirmed" | "cancelled";
  preferredDate: string | null;
  notes: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
};

const STATUS_BADGE: Record<string, { color: string; bg: string }> = {
  pending: { color: "var(--warn)", bg: "color-mix(in srgb, var(--warn) 12%, transparent)" },
  confirmed: { color: "var(--teal)", bg: "color-mix(in srgb, var(--teal) 12%, transparent)" },
  cancelled: { color: "var(--muted)", bg: "color-mix(in srgb, var(--muted) 12%, transparent)" },
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/bookings");
    const data = await res.json();
    setBookings(data.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: "confirmed" | "cancelled") {
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>
        All <em>Bookings</em>
      </h1>
      <p className={styles.pageSub}>Manage patient consultation requests</p>

      <div className={styles.card}>
        {loading ? (
          <div className={styles.emptyState}>Loading…</div>
        ) : bookings.length === 0 ? (
          <div className={styles.emptyState}>No bookings yet.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Preferred date</th>
                <th>Notes</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const s = STATUS_BADGE[b.status] ?? STATUS_BADGE.pending;
                return (
                  <tr key={b.id}>
                    <td>
                      <div style={{ fontWeight: 400 }}>{b.user.name ?? "—"}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{b.user.email}</div>
                    </td>
                    <td>{b.preferredDate ?? "—"}</td>
                    <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.notes ?? "—"}</td>
                    <td>
                      <span className={styles.badge} style={{ color: s.color, background: s.bg }}>{b.status}</span>
                    </td>
                    <td>
                      {b.status === "pending" && (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button type="button" onClick={() => updateStatus(b.id, "confirmed")} style={{ fontSize: "0.72rem", color: "var(--teal)", background: "none", border: "1px solid var(--teal)", borderRadius: "0.4rem", padding: "0.25rem 0.6rem", cursor: "pointer" }}>
                            Confirm
                          </button>
                          <button type="button" onClick={() => updateStatus(b.id, "cancelled")} style={{ fontSize: "0.72rem", color: "var(--muted)", background: "none", border: "1px solid var(--border)", borderRadius: "0.4rem", padding: "0.25rem 0.6rem", cursor: "pointer" }}>
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
