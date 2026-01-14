/**
 * LocalDataStore Implementation
 *
 * IndexedDB-based data store for local-only mode.
 * Implements the DataStore interface from @tally/shared-types.
 */

import { v4 as uuidv4 } from "uuid";
import { getDB, type TallyDBSchema } from "./db";
import type {
  DataStore,
  ExportedChallenge,
  ExportedEntry,
  TallyExportPayload,
  ImportResult,
  EXPORT_SCHEMA_VERSION,
} from "@tally/shared-types";

// Re-export for convenience
export type { ExportedChallenge, ExportedEntry };

/**
 * LocalDataStore - IndexedDB implementation of DataStore
 */
export class LocalDataStore implements DataStore {
  // -------------------------------------------------------------------------
  // Challenges
  // -------------------------------------------------------------------------

  async getChallenges(includeArchived = false): Promise<ExportedChallenge[]> {
    const db = await getDB();
    const all = await db.getAll("challenges");

    if (includeArchived) {
      return all;
    }

    return all.filter((c) => !c.archived);
  }

  async getChallenge(id: string): Promise<ExportedChallenge | null> {
    const db = await getDB();
    const challenge = await db.get("challenges", id);
    return challenge ?? null;
  }

  async putChallenge(
    challenge: Omit<ExportedChallenge, "createdAt" | "updatedAt"> & {
      createdAt?: number;
      updatedAt?: number;
    }
  ): Promise<ExportedChallenge> {
    const db = await getDB();
    const now = Date.now();

    // Check if challenge exists
    const existing = await db.get("challenges", challenge.id);

    const record: TallyDBSchema["challenges"]["value"] = {
      id: challenge.id || uuidv4(),
      name: challenge.name,
      targetNumber: challenge.targetNumber,
      year: challenge.year,
      color: challenge.color,
      icon: challenge.icon,
      timeframeUnit: challenge.timeframeUnit,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      isPublic: challenge.isPublic,
      archived: challenge.archived,
      createdAt: existing?.createdAt ?? challenge.createdAt ?? now,
      updatedAt: challenge.updatedAt ?? now,
    };

    await db.put("challenges", record);
    return record;
  }

  async deleteChallenge(id: string): Promise<void> {
    const db = await getDB();

    // Delete all entries for this challenge first
    const entries = await db.getAllFromIndex("entries", "by-challenge", id);
    const tx = db.transaction(["challenges", "entries"], "readwrite");

    for (const entry of entries) {
      await tx.objectStore("entries").delete(entry.id);
    }

    await tx.objectStore("challenges").delete(id);
    await tx.done;
  }

  // -------------------------------------------------------------------------
  // Entries
  // -------------------------------------------------------------------------

  async getEntries(
    challengeId: string,
    options?: { startDate?: string; endDate?: string }
  ): Promise<ExportedEntry[]> {
    const db = await getDB();
    let entries = await db.getAllFromIndex(
      "entries",
      "by-challenge",
      challengeId
    );

    // Filter by date range if provided
    if (options?.startDate) {
      entries = entries.filter((e) => e.date >= options.startDate!);
    }
    if (options?.endDate) {
      entries = entries.filter((e) => e.date <= options.endDate!);
    }

    return entries;
  }

  async getEntry(id: string): Promise<ExportedEntry | null> {
    const db = await getDB();
    const entry = await db.get("entries", id);
    return entry ?? null;
  }

  async putEntry(
    entry: Omit<ExportedEntry, "createdAt" | "updatedAt"> & {
      createdAt?: number;
      updatedAt?: number;
    }
  ): Promise<ExportedEntry> {
    const db = await getDB();
    const now = Date.now();

    // Check if entry exists
    const existing = await db.get("entries", entry.id);

    const record: TallyDBSchema["entries"]["value"] = {
      id: entry.id || uuidv4(),
      challengeId: entry.challengeId,
      date: entry.date,
      count: entry.count,
      note: entry.note,
      sets: entry.sets,
      feeling: entry.feeling,
      createdAt: existing?.createdAt ?? entry.createdAt ?? now,
      updatedAt: entry.updatedAt ?? now,
    };

    await db.put("entries", record);
    return record;
  }

  async deleteEntry(id: string): Promise<void> {
    const db = await getDB();
    await db.delete("entries", id);
  }

  // -------------------------------------------------------------------------
  // Export/Import
  // -------------------------------------------------------------------------

  async exportAll(): Promise<TallyExportPayload> {
    const db = await getDB();

    const challenges = await db.getAll("challenges");
    const entries = await db.getAll("entries");

    // Dynamic import to get the version constant
    const { EXPORT_SCHEMA_VERSION } = await import("@tally/shared-types");

    return {
      schemaVersion: EXPORT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      source: "web",
      challenges,
      entries,
    };
  }

  async importAll(
    payload: TallyExportPayload,
    options?: { clearExisting?: boolean; skipValidation?: boolean }
  ): Promise<ImportResult> {
    const db = await getDB();
    const errors: string[] = [];

    try {
      // Optionally validate payload
      if (!options?.skipValidation) {
        const { safeValidateExportPayload } = await import(
          "@tally/shared-types"
        );
        const result = safeValidateExportPayload(payload);
        if (!result.success) {
          return {
            success: false,
            challengesImported: 0,
            entriesImported: 0,
            errors: ["Invalid payload: " + JSON.stringify(result.error)],
          };
        }
      }

      // Clear existing data if requested
      if (options?.clearExisting) {
        await this.clearAll();
      }

      // Import challenges
      const tx = db.transaction(["challenges", "entries"], "readwrite");

      for (const challenge of payload.challenges) {
        try {
          await tx.objectStore("challenges").put(challenge);
        } catch (e) {
          errors.push(`Failed to import challenge ${challenge.id}: ${e}`);
        }
      }

      // Import entries
      for (const entry of payload.entries) {
        try {
          await tx.objectStore("entries").put(entry);
        } catch (e) {
          errors.push(`Failed to import entry ${entry.id}: ${e}`);
        }
      }

      await tx.done;

      return {
        success: errors.length === 0,
        challengesImported: payload.challenges.length,
        entriesImported: payload.entries.length,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (e) {
      return {
        success: false,
        challengesImported: 0,
        entriesImported: 0,
        errors: [`Import failed: ${e}`],
      };
    }
  }

  async clearAll(): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(["challenges", "entries"], "readwrite");
    await tx.objectStore("challenges").clear();
    await tx.objectStore("entries").clear();
    await tx.done;
  }

  // -------------------------------------------------------------------------
  // Utility Methods
  // -------------------------------------------------------------------------

  /**
   * Get count of challenges and entries
   */
  async getDataCounts(): Promise<{
    challengeCount: number;
    entryCount: number;
  }> {
    const db = await getDB();
    const challengeCount = await db.count("challenges");
    const entryCount = await db.count("entries");
    return { challengeCount, entryCount };
  }

  /**
   * Check if there's any data stored
   */
  async hasData(): Promise<boolean> {
    const { challengeCount, entryCount } = await this.getDataCounts();
    return challengeCount > 0 || entryCount > 0;
  }
}

// Singleton instance
let localDataStore: LocalDataStore | null = null;

/**
 * Get the singleton LocalDataStore instance
 */
export function getLocalDataStore(): LocalDataStore {
  if (!localDataStore) {
    localDataStore = new LocalDataStore();
  }
  return localDataStore;
}
