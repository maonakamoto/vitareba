import styles from "@/app/(admin)/admin.module.css";
import { BOOKING_STATUS_CONFIG, type BookingStatus } from "@/lib/config/booking-status";
import { formatDateLong } from "@/lib/utils/format";

type Booking = {
  id: string;
  status: BookingStatus;
  preferredDate: string | null;
  notes: string | null;
};

export function PatientBookingsCard({ bookings }: { bookings: Booking[] }) {
  return (
    <div className={styles.card}>
      <p className={styles.cardLabel}>Bookings ({bookings.length})</p>
      {bookings.length === 0 ? (
        <div className={styles.emptyState} style={{ padding: "1rem 0" }}>No bookings.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {bookings.map((b) => {
            const s = BOOKING_STATUS_CONFIG[b.status] ?? BOOKING_STATUS_CONFIG.pending;
            return (
              <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: "0.82rem", paddingBottom: "0.65rem", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ color: "var(--ink2)" }}>
                    {b.preferredDate ? formatDateLong(b.preferredDate) : "No date preference"}
                  </div>
                  {b.notes && <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.2rem" }}>{b.notes}</div>}
                </div>
                <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0.2rem 0.6rem", borderRadius: "1rem", color: s.color, background: s.bg, whiteSpace: "nowrap" }}>
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
