import styles from "@/app/(admin)/admin.module.css";
import { BOOKING_STATUS_CONFIG, type BookingRow } from "@/lib/config/booking-status";
import { formatDateLong } from "@/lib/utils/format";

// Omit createdAt: this card is called from both the server (Drizzle Date) and client (API string).
// The component only renders id/status/preferredDate/notes so we don't need to constrain the date type.
export function PatientBookingsCard({ bookings }: { bookings: Omit<BookingRow, "createdAt">[] }) {
  return (
    <div className={styles.card}>
      <p className={styles.cardLabel}>Bookings ({bookings.length})</p>
      {bookings.length === 0 ? (
        <div className={styles.emptyState}>No bookings.</div>
      ) : (
        <div className={styles.bookingList}>
          {bookings.map((b) => {
            const s = BOOKING_STATUS_CONFIG[b.status] ?? BOOKING_STATUS_CONFIG.pending;
            return (
              <div key={b.id} className={styles.bookingRow}>
                <div>
                  <div className={styles.bookingDate}>
                    {b.preferredDate ? formatDateLong(b.preferredDate) : "No date preference"}
                  </div>
                  {b.notes && <div className={styles.bookingNotes}>{b.notes}</div>}
                </div>
                <span className={styles.badge} style={{ color: s.color, background: s.bg }}>
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
