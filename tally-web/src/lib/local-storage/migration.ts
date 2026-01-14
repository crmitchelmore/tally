/**
 * Migration Service
 *
 * Handles migration from local-only mode to synced mode.
 * Exports local data and imports into Convex.
 */

import { getLocalDataStore } from "./local-data-store";
import { getAppModeStore } from "./mode";
import type {
  MigrationResult,
  MigrationCheck,
  MigrationConflictResolution,
} from "@tally/shared-types";

/**
 * Check the migration state - what data exists locally and in cloud
 */
export async function checkMigrationState(
  cloudCheck?: { hasData: boolean; challengeCount: number; entryCount: number }
): Promise<MigrationCheck> {
  const localStore = getLocalDataStore();
  const localCounts = await localStore.getDataCounts();

  return {
    hasLocalData: localCounts.challengeCount > 0 || localCounts.entryCount > 0,
    localChallengeCount: localCounts.challengeCount,
    localEntryCount: localCounts.entryCount,
    hasCloudData: cloudCheck?.hasData ?? false,
    cloudChallengeCount: cloudCheck?.challengeCount,
  };
}

/**
 * Migrate local data to cloud (Convex)
 *
 * @param convexUrl - The Convex deployment URL
 * @param authToken - Clerk auth token for the request
 * @param resolution - How to handle conflicts if cloud has data
 */
export async function migrateLocalToCloud(
  convexUrl: string,
  authToken: string,
  resolution: MigrationConflictResolution = "replace-cloud"
): Promise<MigrationResult> {
  const localStore = getLocalDataStore();
  const modeStore = getAppModeStore();

  try {
    // 1. Export all local data
    const exportPayload = await localStore.exportAll();

    if (
      exportPayload.challenges.length === 0 &&
      exportPayload.entries.length === 0
    ) {
      // No data to migrate - just switch mode
      modeStore.setMode("synced");
      modeStore.setMigrationCompleted(true);
      return {
        success: true,
        newMode: "synced",
      };
    }

    // 2. Send to Convex migration endpoint
    const response = await fetch(`${convexUrl}/api/v1/migration/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        schemaVersion: exportPayload.schemaVersion,
        challenges: exportPayload.challenges,
        entries: exportPayload.entries,
        strategy: resolution === "replace-cloud" ? "replace" : "skip",
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        newMode: "local-only",
        error:
          error.error || `Migration failed with status ${response.status}`,
      };
    }

    const result = await response.json();

    // 3. On success, clear local data and switch mode
    if (result.success) {
      await localStore.clearAll();
      modeStore.setMode("synced");
      modeStore.setMigrationCompleted(true);
    }

    return {
      success: result.success,
      newMode: result.success ? "synced" : "local-only",
      importResult: result,
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      newMode: "local-only",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Skip migration - just switch to synced mode without migrating data
 */
export function skipMigration(): void {
  const modeStore = getAppModeStore();
  modeStore.setMode("synced");
  modeStore.setMigrationCompleted(true);
}

/**
 * Stay in local-only mode (cancel migration)
 */
export function cancelMigration(): void {
  // Just don't change anything
}
