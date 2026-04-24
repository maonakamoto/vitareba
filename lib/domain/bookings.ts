import { z } from "zod";
import { BOOKING_PREFERRED_DATE_MAX_LENGTH, BOOKING_NOTES_MAX_LENGTH } from "@/lib/config/portal";
import { BOOKING_TYPE_VALUES, MACHINE_TYPE_VALUES, BOOKING_STATUS_VALUES } from "@/lib/config/booking-status";

/** Validates a patient booking creation request body */
export const bookingCreateSchema = z.object({
  bookingType: z.enum(BOOKING_TYPE_VALUES).default("consultation"),
  machineType: z.enum(MACHINE_TYPE_VALUES).nullable().optional(),
  preferredDate: z.string().max(BOOKING_PREFERRED_DATE_MAX_LENGTH).optional(),
  notes: z.string().max(BOOKING_NOTES_MAX_LENGTH).optional(),
});

/** Validates an admin-initiated booking (for a specific patient, status settable) */
export const adminBookingCreateSchema = bookingCreateSchema.extend({
  patientId: z.string().uuid(),
  status: z.enum(BOOKING_STATUS_VALUES).optional(),
});
