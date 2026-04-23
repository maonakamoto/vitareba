import { z } from "zod";
import { GOAL_TITLE_MAX_LENGTH, GOAL_NOTES_MAX_LENGTH } from "@/lib/config/portal";

/**
 * Compute goal progress as a 0–100 integer percentage of the target range achieved.
 *
 * Formula: ((current - baseline) / (target - baseline)) * 100
 * Clamped to [0, 100] and rounded to the nearest integer.
 *
 * Returns null when the range is zero (baseline === target) or any required
 * value is missing — the UI should fall back to showing raw numbers.
 *
 * IMPORTANT: Do NOT use current/target — that ignores the baseline offset.
 */
export function computeGoalProgress(
  baseline: number | null | undefined,
  current: number | null | undefined,
  target: number | null | undefined
): number | null {
  if (current == null || target == null) return null;
  const base = baseline ?? 0;
  const range = target - base;
  if (range === 0) return null;
  return Math.min(100, Math.max(0, Math.round(((current - base) / range) * 100)));
}

const goalFieldsSchema = z.object({
  title: z.string().min(1).max(GOAL_TITLE_MAX_LENGTH),
  metric: z.string().max(50).optional().nullable(),
  baseline: z.number().int().min(0).max(100).optional().nullable(),
  target: z.number().int().min(0).max(100).optional().nullable(),
  current: z.number().int().min(0).max(100).optional().nullable(),
  notes: z.string().max(GOAL_NOTES_MAX_LENGTH).optional().nullable(),
});

/** Schema for creating a new clinical goal (admin only) */
export const goalCreateSchema = goalFieldsSchema;

/** Schema for updating an existing clinical goal (all fields optional, plus completed flag) */
export const goalUpdateSchema = goalFieldsSchema.partial().extend({
  completed: z.boolean().optional(),
});
