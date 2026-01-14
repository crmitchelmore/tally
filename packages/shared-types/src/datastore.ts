/**
 * DataStore Contract
 *
 * Abstraction layer for data persistence. Two implementations:
 * - LocalDataStore: IndexedDB (web), SQLite/CoreData (iOS), Room (Android)
 * - SyncedDataStore: Wraps Convex real-time database
 *
 * The app runs in one of two modes:
 * - `local-only`: Uses LocalDataStore, no network, single device
 * - `synced`: Uses SyncedDataStore, real-time sync across devices
 */

import type {
  ExportedChallenge,
  ExportedEntry,
  TallyExportPayload,
  ImportResult,
} from "./export-schema.js";

// =============================================================================
// App Mode
// =============================================================================

/**
 * The current data mode of the application
 * - `local-only`: Data stored only on this device, no account required
 * - `synced`: Data synced to cloud, requires authenticated account
 */
export type AppMode = "local-only" | "synced";

// =============================================================================
// DataStore Interface
// =============================================================================

/**
 * Core data store operations shared across all platforms.
 *
 * Implementations:
 * - LocalDataStore: Persists to device-local storage
 * - SyncedDataStore: Wraps Convex for cloud sync
 */
export interface DataStore {
  // -------------------------------------------------------------------------
  // Challenges
  // -------------------------------------------------------------------------

  /**
   * Get all challenges for the current user
   * @param includeArchived Whether to include archived challenges
   */
  getChallenges(includeArchived?: boolean): Promise<ExportedChallenge[]>;

  /**
   * Get a single challenge by ID
   * @param id Challenge UUID (local-only) or server ID (synced)
   */
  getChallenge(id: string): Promise<ExportedChallenge | null>;

  /**
   * Create or update a challenge
   * @param challenge The challenge data (id is required for update)
   * @returns The saved challenge with any server-assigned fields
   */
  putChallenge(
    challenge: Omit<ExportedChallenge, "createdAt" | "updatedAt"> & {
      createdAt?: number;
      updatedAt?: number;
    }
  ): Promise<ExportedChallenge>;

  /**
   * Delete a challenge and all its entries
   * @param id Challenge ID
   */
  deleteChallenge(id: string): Promise<void>;

  // -------------------------------------------------------------------------
  // Entries
  // -------------------------------------------------------------------------

  /**
   * Get entries for a challenge
   * @param challengeId Challenge ID
   * @param options Optional filtering (date range)
   */
  getEntries(
    challengeId: string,
    options?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ExportedEntry[]>;

  /**
   * Get a single entry by ID
   */
  getEntry(id: string): Promise<ExportedEntry | null>;

  /**
   * Create or update an entry
   */
  putEntry(
    entry: Omit<ExportedEntry, "createdAt" | "updatedAt"> & {
      createdAt?: number;
      updatedAt?: number;
    }
  ): Promise<ExportedEntry>;

  /**
   * Delete an entry
   */
  deleteEntry(id: string): Promise<void>;

  // -------------------------------------------------------------------------
  // Export/Import
  // -------------------------------------------------------------------------

  /**
   * Export all data as a TallyExportPayload
   */
  exportAll(): Promise<TallyExportPayload>;

  /**
   * Import data from a TallyExportPayload
   * @param payload The export payload to import
   * @param options Import options
   */
  importAll(
    payload: TallyExportPayload,
    options?: {
      /** If true, clear existing data before import */
      clearExisting?: boolean;
      /** If true, skip validation (use with caution) */
      skipValidation?: boolean;
    }
  ): Promise<ImportResult>;

  /**
   * Clear all data from the store
   */
  clearAll(): Promise<void>;
}

// =============================================================================
// Migration Types
// =============================================================================

/**
 * Result of checking for migration conflicts
 */
export interface MigrationCheck {
  /** Whether the user has local data to migrate */
  hasLocalData: boolean;
  /** Number of local challenges */
  localChallengeCount: number;
  /** Number of local entries */
  localEntryCount: number;
  /** Whether the cloud account already has data */
  hasCloudData: boolean;
  /** Number of cloud challenges (if signed in) */
  cloudChallengeCount?: number;
}

/**
 * User's choice when migrating with existing cloud data
 */
export type MigrationConflictResolution =
  | "replace-cloud" // Discard cloud data, use local
  | "keep-cloud" // Discard local data, use cloud
  | "cancel"; // Don't migrate, stay in current mode

/**
 * Result of a migration operation
 */
export interface MigrationResult {
  success: boolean;
  /** New mode after migration */
  newMode: AppMode;
  /** Import result if data was migrated */
  importResult?: ImportResult;
  /** Error message if migration failed */
  error?: string;
}

// =============================================================================
// Mode Persistence
// =============================================================================

/**
 * Interface for persisting app mode selection
 */
export interface AppModeStore {
  /**
   * Get the current app mode
   * @returns The current mode, or null if not set (first launch)
   */
  getMode(): AppMode | null;

  /**
   * Set the app mode
   */
  setMode(mode: AppMode): void;

  /**
   * Check if migration has been completed
   */
  isMigrationCompleted(): boolean;

  /**
   * Mark migration as completed
   */
  setMigrationCompleted(completed: boolean): void;
}
