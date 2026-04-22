import { z } from "zod";

const goalFieldsSchema = z.object({
  title: z.string().min(1).max(300),
  metric: z.string().max(50).optional().nullable(),
  baseline: z.number().int().min(0).max(100).optional().nullable(),
  target: z.number().int().min(0).max(100).optional().nullable(),
  current: z.number().int().min(0).max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

/** Schema for creating a new clinical goal (admin only) */
export const goalCreateSchema = goalFieldsSchema;

/** Schema for updating an existing clinical goal (all fields optional, plus completed flag) */
export const goalUpdateSchema = goalFieldsSchema.partial().extend({
  completed: z.boolean().optional(),
});
