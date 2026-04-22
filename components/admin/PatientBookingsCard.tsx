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
