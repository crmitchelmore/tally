/**
 * IndexedDB Database Schema
 *
 * Local storage for Tally data when running in local-only mode.
 * Uses the `idb` library for a Promise-based IndexedDB wrapper.
 */

import { openDB, type IDBPDatabase, type DBSchema } from "idb";

// =============================================================================
// Database Schema
// =============================================================================

export interface TallyDBSchema extends DBSchema {
  challenges: {
    key: string; // UUID
    value: {
      id: string;
      name: string;
      targetNumber: number;
      year: number;
      color: string;
      icon: string;
      timeframeUnit: "year" | "month" | "custom";
      startDate?: string;
      endDate?: string;
      isPublic: boolean;
      archived: boolean;
      createdAt: number;
      updatedAt: number;
    };
    indexes: {
      "by-archived": number; // 0 or 1 for boolean indexing
      "by-year": number;
    };
  };
  entries: {
    key: string; // UUID
    value: {
      id: string;
      challengeId: string; // UUID reference
      date: string; // YYYY-MM-DD
      count: number;
      note?: string;
      sets?: Array<{ reps: number }>;
      feeling?: "very-easy" | "easy" | "moderate" | "hard" | "very-hard";
      createdAt: number;
      updatedAt: number;
    };
    indexes: {
      "by-challenge": string;
      "by-date": string;
      "by-challenge-date": [string, string];
    };
  };
  settings: {
    key: string;
    value: {
      key: string;
      value: unknown;
    };
  };
}

// Database name and version
const DB_NAME = "tally-local";
const DB_VERSION = 1;

// Singleton database instance
let dbPromise: Promise<IDBPDatabase<TallyDBSchema>> | null = null;

/**
 * Get the IndexedDB database instance.
 * Creates the database and object stores if they don't exist.
 */
export async function getDB(): Promise<IDBPDatabase<TallyDBSchema>> {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is not available in server-side rendering");
  }

  if (!dbPromise) {
    dbPromise = openDB<TallyDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // Version 1: Initial schema
        if (oldVersion < 1) {
          // Challenges store
          const challengeStore = db.createObjectStore("challenges", {
            keyPath: "id",
          });
          challengeStore.createIndex("by-archived", "archived");
          challengeStore.createIndex("by-year", "year");

          // Entries store
          const entryStore = db.createObjectStore("entries", {
            keyPath: "id",
          });
          entryStore.createIndex("by-challenge", "challengeId");
          entryStore.createIndex("by-date", "date");
          entryStore.createIndex("by-challenge-date", ["challengeId", "date"]);

          // Settings store (for app mode, etc.)
          db.createObjectStore("settings", { keyPath: "key" });
        }
      },
      blocked() {
        console.warn("IndexedDB upgrade blocked by another tab");
      },
      blocking() {
        console.warn("This tab is blocking an IndexedDB upgrade");
      },
      terminated() {
        console.error("IndexedDB connection terminated unexpectedly");
        dbPromise = null;
      },
    });
  }

  return dbPromise;
}

/**
 * Close the database connection.
 * Useful for testing or cleanup.
 */
export async function closeDB(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }
}

/**
 * Delete the entire database.
 * Useful for testing or factory reset.
 */
export async function deleteDB(): Promise<void> {
  await closeDB();
  if (typeof window !== "undefined") {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        console.warn("Database deletion blocked");
        resolve(); // Don't fail, just warn
      };
    });
  }
}
