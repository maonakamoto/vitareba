import { z } from "zod";
import { PROGRAMME_ENUM_VALUES, PHASE_ENUM_VALUES } from "@/lib/config/programmes";
import { PATIENT_NOTE_MAX_LENGTH, PROGRAMME_START_DATE_MAX_LENGTH } from "@/lib/config/portal";

/** Validates an admin PATCH body for programme assignment upserts */
export const programmeUpdateSchema = z.object({
  programme: z.enum(PROGRAMME_ENUM_VALUES),
  phase: z.enum(PHASE_ENUM_VALUES),
  startDate: z.string().max(PROGRAMME_START_DATE_MAX_LENGTH).nullable().optional(),
  notes: z.string().max(PATIENT_NOTE_MAX_LENGTH).nullable().optional(),
});
