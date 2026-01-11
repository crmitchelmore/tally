/**
 * Tally API Schemas (Zod)
 *
 * Runtime validation schemas for API requests. These schemas provide:
 * - Type inference (use z.infer<typeof Schema>)
 * - Runtime validation (use Schema.parse() or Schema.safeParse())
 * - Clear error messages for invalid data
 *
 * Usage in Convex HTTP handlers:
 *   const result = CreateChallengeSchema.safeParse(await request.json());
 *   if (!result.success) return json(400, { error: result.error.message });
 *
 * Usage in mobile clients:
 *   let challenge = try CreateChallengeSchema.parse(data) // Swift/Kotlin
 */

import { z } from "zod";

// =============================================================================
// Shared Enums & Primitives
// =============================================================================

export const TimeframeUnitSchema = z.enum(["year", "month", "custom"]);

export const FeelingSchema = z.enum([
  "very-easy",
  "easy",
  "moderate",
  "hard",
  "very-hard",
]);

/** ISO date string (YYYY-MM-DD) */
export const DateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format");

/** Hex color (#RGB or #RRGGBB) */
export const ColorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color");

/** Convex ID format (starts with k... or j...) */
export const ConvexIdSchema = z.string().min(1, "ID is required");

// =============================================================================
// Request Schemas
// =============================================================================

export const CreateChallengeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  targetNumber: z.number().int().positive("Target must be positive"),
  year: z.number().int().min(2020).max(2100),
  color: ColorSchema,
  icon: z.string().min(1, "Icon is required"),
  timeframeUnit: TimeframeUnitSchema,
  startDate: DateStringSchema.optional(),
  endDate: DateStringSchema.optional(),
  isPublic: z.boolean().optional().default(false),
});

export const UpdateChallengeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  targetNumber: z.number().int().positive().optional(),
  color: ColorSchema.optional(),
  icon: z.string().min(1).optional(),
  isPublic: z.boolean().optional(),
  archived: z.boolean().optional(),
});

export const EntrySetSchema = z.object({
  reps: z.number().int().nonnegative("Reps cannot be negative"),
});

export const CreateEntrySchema = z.object({
  challengeId: ConvexIdSchema,
  date: DateStringSchema,
  count: z.number().int().nonnegative("Count cannot be negative"),
  note: z.string().max(500, "Note too long").optional(),
  sets: z.array(EntrySetSchema).optional(),
  feeling: FeelingSchema.optional(),
});

export const UpdateEntrySchema = z.object({
  count: z.number().int().nonnegative().optional(),
  note: z.string().max(500).optional(),
  date: DateStringSchema.optional(),
  sets: z.array(EntrySetSchema).optional(),
  feeling: FeelingSchema.optional(),
});

export const FollowChallengeSchema = z.object({
  challengeId: ConvexIdSchema,
});

// =============================================================================
// Query Parameter Schemas
// =============================================================================

export const ChallengesQuerySchema = z.object({
  active: z.enum(["true", "false"]).optional(),
});

export const EntriesQuerySchema = z.object({
  challengeId: ConvexIdSchema.optional(),
  date: DateStringSchema.optional(),
  startDate: DateStringSchema.optional(),
  endDate: DateStringSchema.optional(),
});

// =============================================================================
// Response Schemas (for client-side validation)
// =============================================================================

export const ErrorResponseSchema = z.object({
  error: z.string(),
});

export const SuccessResponseSchema = z.object({
  success: z.literal(true),
});

export const CreateResponseSchema = z.object({
  id: z.string(),
});

export const AuthUserResponseSchema = z.object({
  userId: z.string(),
  clerkId: z.string(),
});

export const ChallengeDTOSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  targetNumber: z.number(),
  year: z.number(),
  color: z.string(),
  icon: z.string(),
  timeframeUnit: TimeframeUnitSchema,
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isPublic: z.boolean(),
  archived: z.boolean(),
  createdAt: z.number(),
});

export const EntryDTOSchema = z.object({
  id: z.string(),
  userId: z.string(),
  challengeId: z.string(),
  date: z.string(),
  count: z.number(),
  note: z.string().optional(),
  sets: z.array(EntrySetSchema).optional(),
  feeling: FeelingSchema.optional(),
  createdAt: z.number(),
});

export const FollowedChallengeDTOSchema = z.object({
  id: z.string(),
  userId: z.string(),
  challengeId: z.string(),
  followedAt: z.number(),
});

// =============================================================================
// Type Exports (inferred from schemas)
// =============================================================================

export type CreateChallengeInput = z.infer<typeof CreateChallengeSchema>;
export type UpdateChallengeInput = z.infer<typeof UpdateChallengeSchema>;
export type CreateEntryInput = z.infer<typeof CreateEntrySchema>;
export type UpdateEntryInput = z.infer<typeof UpdateEntrySchema>;
export type FollowChallengeInput = z.infer<typeof FollowChallengeSchema>;
