import { z } from "zod";
import { BOOKING_PREFERRED_DATE_MAX_LENGTH, BOOKING_NOTES_MAX_LENGTH } from "@/lib/config/portal";

/** Validates a patient booking creation request body */
export const bookingCreateSchema = z.object({
  preferredDate: z.string().max(BOOKING_PREFERRED_DATE_MAX_LENGTH).optional(),
  notes: z.string().max(BOOKING_NOTES_MAX_LENGTH).optional(),
});
