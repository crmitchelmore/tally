/**
 * Local Storage Module
 *
 * Exports all local storage functionality for local-only mode.
 */

// Database
export { getDB, closeDB, deleteDB, type TallyDBSchema } from "./db";

// Data Store
export {
  LocalDataStore,
  getLocalDataStore,
  type ExportedChallenge,
  type ExportedEntry,
} from "./local-data-store";

// Mode Management
export {
  getAppModeStore,
  isLocalOnlyMode,
  isSyncedMode,
  hasModeBeenChosen,
} from "./mode";

// Migration
export {
  checkMigrationState,
  migrateLocalToCloud,
  skipMigration,
  cancelMigration,
} from "./migration";
