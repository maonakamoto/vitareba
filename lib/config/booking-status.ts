// Booking status display config — SSOT for all status colors used across admin and portal

/** Canonical booking status values — used for Zod validation and UI filter options */
export const BOOKING_STATUS_VALUES = ["pending", "confirmed", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUS_VALUES)[number];

/** Named status constants for use in DB queries and logic — derived from BOOKING_STATUS_VALUES */
export const BOOKING_STATUS = {
  pending: "pending",
  confirmed: "confirmed",
  cancelled: "cancelled",
} as const satisfies Record<BookingStatus, BookingStatus>;

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, { color: string; bg: string }> = {
  pending: {
    color: "var(--warn)",
    bg: "color-mix(in srgb, var(--warn) 12%, transparent)",
  },
  confirmed: {
    color: "var(--teal)",
    bg: "color-mix(in srgb, var(--teal) 12%, transparent)",
  },
  cancelled: {
    color: "var(--muted)",
    bg: "color-mix(in srgb, var(--muted) 12%, transparent)",
  },
};
