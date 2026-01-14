/**
 * App Mode Management
 *
 * Handles persistence and retrieval of the app's data mode:
 * - 'local-only': Data stored only on device, no account required
 * - 'synced': Data synced to cloud, requires authenticated account
 */

import type { AppMode, AppModeStore } from "@tally/shared-types";

const MODE_KEY = "tally:appMode";
const MIGRATION_KEY = "tally:migrationCompleted";

/**
 * LocalStorage-based AppModeStore implementation
 */
class LocalAppModeStore implements AppModeStore {
  getMode(): AppMode | null {
    if (typeof window === "undefined") return null;

    const value = localStorage.getItem(MODE_KEY);
    if (value === "local-only" || value === "synced") {
      return value;
    }
    return null;
  }

  setMode(mode: AppMode): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(MODE_KEY, mode);
  }

  isMigrationCompleted(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(MIGRATION_KEY) === "true";
  }

  setMigrationCompleted(completed: boolean): void {
    if (typeof window === "undefined") return;
    if (completed) {
      localStorage.setItem(MIGRATION_KEY, "true");
    } else {
      localStorage.removeItem(MIGRATION_KEY);
    }
  }

  /**
   * Clear all mode-related state.
   * Useful for testing or factory reset.
   */
  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(MODE_KEY);
    localStorage.removeItem(MIGRATION_KEY);
  }
}

// Singleton instance
let appModeStore: LocalAppModeStore | null = null;

/**
 * Get the singleton AppModeStore instance
 */
export function getAppModeStore(): AppModeStore & { clear: () => void } {
  if (!appModeStore) {
    appModeStore = new LocalAppModeStore();
  }
  return appModeStore;
}

/**
 * Check if the app is in local-only mode
 */
export function isLocalOnlyMode(): boolean {
  return getAppModeStore().getMode() === "local-only";
}

/**
 * Check if the app is in synced mode
 */
export function isSyncedMode(): boolean {
  return getAppModeStore().getMode() === "synced";
}

/**
 * Check if user has explicitly chosen a mode
 * (vs. being a first-time user)
 */
export function hasModeBeenChosen(): boolean {
  return getAppModeStore().getMode() !== null;
}
