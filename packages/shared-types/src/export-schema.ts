/**
 * Tally Export/Import Schema
 *
 * Canonical format for exporting and importing user data across platforms.
 * This schema is used for:
 * - User data export/backup
 * - Local-only mode data persistence
 * - Migration from local-only to synced mode
 *
 * Version history:
 * - 1.0.0: Initial schema (challenges, entries)
 */

import { z } from "zod";
import {
  TimeframeUnitSchema,
  FeelingSchema,
  DateStringSchema,
  ColorSchema,
  EntrySetSchema,
} from "./schemas.js";

// =============================================================================
// Export Schema Version
// =============================================================================

export const EXPORT_SCHEMA_VERSION = "1.0.0";

export const ExportSchemaVersionSchema = z.string().regex(/^\d+\.\d+\.\d+$/);

// =============================================================================
// Exported Challenge (with UUID, no server-specific fields)
// =============================================================================

export const ExportedChallengeSchema = z.object({
  /** UUID v4 - stable ID for the challenge */
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  targetNumber: z.number().int().positive(),
  year: z.number().int().min(2020).max(2100),
  color: ColorSchema,
  icon: z.string().min(1),
  timeframeUnit: TimeframeUnitSchema,
  startDate: DateStringSchema.optional(),
  endDate: DateStringSchema.optional(),
  isPublic: z.boolean(),
  archived: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type ExportedChallenge = z.infer<typeof ExportedChallengeSchema>;

// =============================================================================
// Exported Entry (with UUID, references challenge by UUID)
// =============================================================================

export const ExportedEntrySchema = z.object({
  /** UUID v4 - stable ID for the entry */
  id: z.string().uuid(),
  /** UUID v4 - references the challenge this entry belongs to */
  challengeId: z.string().uuid(),
  date: DateStringSchema,
  count: z.number().int().nonnegative(),
  note: z.string().max(500).optional(),
  sets: z.array(EntrySetSchema).optional(),
  feeling: FeelingSchema.optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type ExportedEntry = z.infer<typeof ExportedEntrySchema>;

// =============================================================================
// Full Export Payload
// =============================================================================

export const TallyExportPayloadSchema = z.object({
  /** Schema version for forward compatibility */
  schemaVersion: ExportSchemaVersionSchema,
  /** ISO timestamp of when the export was created */
  exportedAt: z.string().datetime(),
  /** Source platform (for debugging/analytics) */
  source: z.enum(["web", "ios", "android"]),
  /** All challenges */
  challenges: z.array(ExportedChallengeSchema),
  /** All entries */
  entries: z.array(ExportedEntrySchema),
});

export type TallyExportPayload = z.infer<typeof TallyExportPayloadSchema>;

// =============================================================================
// Import Result Types
// =============================================================================

export const ImportResultSchema = z.object({
  success: z.boolean(),
  challengesImported: z.number().int().nonnegative(),
  entriesImported: z.number().int().nonnegative(),
  /** Map of old UUIDs to new server IDs (for synced mode) */
  idMappings: z
    .object({
      challenges: z.record(z.string(), z.string()),
      entries: z.record(z.string(), z.string()),
    })
    .optional(),
  errors: z.array(z.string()).optional(),
});

export type ImportResult = z.infer<typeof ImportResultSchema>;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Creates an empty export payload
 */
export function createEmptyExportPayload(
  source: "web" | "ios" | "android"
): TallyExportPayload {
  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    source,
    challenges: [],
    entries: [],
  };
}

/**
 * Validates an export payload
 * @returns The validated payload or throws a ZodError
 */
export function validateExportPayload(data: unknown): TallyExportPayload {
  return TallyExportPayloadSchema.parse(data);
}

/**
 * Safely validates an export payload
 * @returns Success result with data or error result
 */
export function safeValidateExportPayload(data: unknown) {
  return TallyExportPayloadSchema.safeParse(data);
}
