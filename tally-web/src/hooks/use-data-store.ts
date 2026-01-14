"use client";

/**
 * useDataStore Hook
 *
 * Unified data access hook that works in both local-only and synced modes.
 * Returns the appropriate data store based on current app mode.
 *
 * In local-only mode: Uses IndexedDB via LocalDataStore
 * In synced mode: Uses Convex via existing hooks/mutations
 */

import { useCallback, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAppMode } from "@/providers/app-mode-provider";
import { getLocalDataStore } from "@/lib/local-storage";
import type {
  ExportedChallenge,
  ExportedEntry,
  TallyExportPayload,
  ImportResult,
} from "@tally/shared-types";
import { v4 as uuidv4 } from "uuid";

// =============================================================================
// Types
// =============================================================================

interface DataStoreHook {
  /** Whether the store is ready for use */
  isReady: boolean;
  /** Current mode */
  mode: "local-only" | "synced" | null;

  // Challenge operations
  challenges: ExportedChallenge[] | undefined;
  isLoadingChallenges: boolean;
  createChallenge: (
    data: Omit<ExportedChallenge, "id" | "createdAt" | "updatedAt">
  ) => Promise<string>;
  updateChallenge: (
    id: string,
    data: Partial<ExportedChallenge>
  ) => Promise<void>;
  deleteChallenge: (id: string) => Promise<void>;

  // Entry operations
  getEntries: (challengeId: string) => Promise<ExportedEntry[]>;
  createEntry: (
    data: Omit<ExportedEntry, "id" | "createdAt" | "updatedAt">
  ) => Promise<string>;
  updateEntry: (id: string, data: Partial<ExportedEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;

  // Export/Import
  exportAll: () => Promise<TallyExportPayload>;
  importAll: (
    payload: TallyExportPayload,
    options?: { clearExisting?: boolean }
  ) => Promise<ImportResult>;
  clearAll: () => Promise<void>;
}

// =============================================================================
// Local-Only Implementation
// =============================================================================

function useLocalDataStore(): DataStoreHook {
  const { isReady } = useAppMode();
  const localStore = useMemo(() => getLocalDataStore(), []);

  // For local mode, we need to manage our own state
  // We'll use a simple approach: fetch on demand
  // In a real app, you might want to add React Query or SWR for caching

  const createChallenge = useCallback(
    async (
      data: Omit<ExportedChallenge, "id" | "createdAt" | "updatedAt">
    ): Promise<string> => {
      const id = uuidv4();
      await localStore.putChallenge({
        ...data,
        id,
      });
      return id;
    },
    [localStore]
  );

  const updateChallenge = useCallback(
    async (id: string, data: Partial<ExportedChallenge>): Promise<void> => {
      const existing = await localStore.getChallenge(id);
      if (!existing) throw new Error("Challenge not found");
      await localStore.putChallenge({
        ...existing,
        ...data,
        id,
      });
    },
    [localStore]
  );

  const deleteChallenge = useCallback(
    async (id: string): Promise<void> => {
      await localStore.deleteChallenge(id);
    },
    [localStore]
  );

  const getEntries = useCallback(
    async (challengeId: string): Promise<ExportedEntry[]> => {
      return localStore.getEntries(challengeId);
    },
    [localStore]
  );

  const createEntry = useCallback(
    async (
      data: Omit<ExportedEntry, "id" | "createdAt" | "updatedAt">
    ): Promise<string> => {
      const id = uuidv4();
      await localStore.putEntry({
        ...data,
        id,
      });
      return id;
    },
    [localStore]
  );

  const updateEntry = useCallback(
    async (id: string, data: Partial<ExportedEntry>): Promise<void> => {
      const existing = await localStore.getEntry(id);
      if (!existing) throw new Error("Entry not found");
      await localStore.putEntry({
        ...existing,
        ...data,
        id,
      });
    },
    [localStore]
  );

  const deleteEntry = useCallback(
    async (id: string): Promise<void> => {
      await localStore.deleteEntry(id);
    },
    [localStore]
  );

  const exportAll = useCallback(async (): Promise<TallyExportPayload> => {
    return localStore.exportAll();
  }, [localStore]);

  const importAll = useCallback(
    async (
      payload: TallyExportPayload,
      options?: { clearExisting?: boolean }
    ): Promise<ImportResult> => {
      return localStore.importAll(payload, options);
    },
    [localStore]
  );

  const clearAll = useCallback(async (): Promise<void> => {
    await localStore.clearAll();
  }, [localStore]);

  return {
    isReady,
    mode: "local-only",
    challenges: undefined, // Will be fetched on demand
    isLoadingChallenges: false,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    getEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    exportAll,
    importAll,
    clearAll,
  };
}

// =============================================================================
// Synced (Convex) Implementation
// =============================================================================

function useSyncedDataStore(): DataStoreHook {
  const { isReady } = useAppMode();

  // Convex queries and mutations
  const challenges = useQuery(api.challenges.listMine, {});
  const createChallengeMutation = useMutation(api.challenges.create);
  const updateChallengeMutation = useMutation(api.challenges.update);
  const deleteChallengeMutation = useMutation(api.challenges.remove);
  const createEntryMutation = useMutation(api.entries.create);
  const updateEntryMutation = useMutation(api.entries.update);
  const deleteEntryMutation = useMutation(api.entries.remove);
  const bulkImportMutation = useMutation(api.import.bulkImport);
  const clearAllMutation = useMutation(api.import.clearAllData);

  // Transform Convex documents to ExportedChallenge format
  const transformedChallenges = useMemo((): ExportedChallenge[] | undefined => {
    if (!challenges) return undefined;
    return challenges.map((c) => ({
      id: c._id,
      name: c.name,
      targetNumber: c.targetNumber,
      year: c.year,
      color: c.color,
      icon: c.icon,
      timeframeUnit: c.timeframeUnit,
      startDate: c.startDate,
      endDate: c.endDate,
      isPublic: c.isPublic,
      archived: c.archived,
      createdAt: c.createdAt,
      updatedAt: c.createdAt, // Convex doesn't track updatedAt separately
    }));
  }, [challenges]);

  const createChallenge = useCallback(
    async (
      data: Omit<ExportedChallenge, "id" | "createdAt" | "updatedAt">
    ): Promise<string> => {
      const id = await createChallengeMutation({
        name: data.name,
        targetNumber: data.targetNumber,
        year: data.year,
        color: data.color,
        icon: data.icon,
        timeframeUnit: data.timeframeUnit,
        startDate: data.startDate,
        endDate: data.endDate,
        isPublic: data.isPublic,
      });
      return id;
    },
    [createChallengeMutation]
  );

  const updateChallenge = useCallback(
    async (id: string, data: Partial<ExportedChallenge>): Promise<void> => {
      await updateChallengeMutation({
        id: id as Parameters<typeof updateChallengeMutation>[0]["id"],
        name: data.name,
        targetNumber: data.targetNumber,
        color: data.color,
        icon: data.icon,
        isPublic: data.isPublic,
        archived: data.archived,
      });
    },
    [updateChallengeMutation]
  );

  const deleteChallenge = useCallback(
    async (id: string): Promise<void> => {
      await deleteChallengeMutation({
        id: id as Parameters<typeof deleteChallengeMutation>[0]["id"],
      });
    },
    [deleteChallengeMutation]
  );

  const getEntries = useCallback(
    async (_challengeId: string): Promise<ExportedEntry[]> => {
      // For synced mode, entries are typically fetched via useQuery in components
      // This is a placeholder - real implementation would need to be async query
      console.warn(
        "getEntries in synced mode should use useQuery(api.entries.listByChallenge)"
      );
      return [];
    },
    []
  );

  const createEntry = useCallback(
    async (
      data: Omit<ExportedEntry, "id" | "createdAt" | "updatedAt">
    ): Promise<string> => {
      const id = await createEntryMutation({
        challengeId: data.challengeId as Parameters<
          typeof createEntryMutation
        >[0]["challengeId"],
        date: data.date,
        count: data.count,
        note: data.note,
        sets: data.sets,
        feeling: data.feeling,
      });
      return id;
    },
    [createEntryMutation]
  );

  const updateEntry = useCallback(
    async (id: string, data: Partial<ExportedEntry>): Promise<void> => {
      await updateEntryMutation({
        id: id as Parameters<typeof updateEntryMutation>[0]["id"],
        count: data.count,
        note: data.note,
        date: data.date,
        sets: data.sets,
        feeling: data.feeling,
      });
    },
    [updateEntryMutation]
  );

  const deleteEntry = useCallback(
    async (id: string): Promise<void> => {
      await deleteEntryMutation({
        id: id as Parameters<typeof deleteEntryMutation>[0]["id"],
      });
    },
    [deleteEntryMutation]
  );

  const exportAll = useCallback(async (): Promise<TallyExportPayload> => {
    // For synced mode, we'd need to fetch all data
    // This is a simplified implementation
    const { EXPORT_SCHEMA_VERSION } = await import("@tally/shared-types");
    return {
      schemaVersion: EXPORT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      source: "web",
      challenges: transformedChallenges || [],
      entries: [], // Would need to fetch entries
    };
  }, [transformedChallenges]);

  const importAll = useCallback(
    async (
      payload: TallyExportPayload,
      _options?: { clearExisting?: boolean }
    ): Promise<ImportResult> => {
      try {
        const result = await bulkImportMutation({
          challenges: payload.challenges.map((c) => ({
            id: c.id,
            name: c.name,
            targetNumber: c.targetNumber,
            year: c.year,
            color: c.color,
            icon: c.icon,
            timeframeUnit: c.timeframeUnit,
            startDate: c.startDate,
            endDate: c.endDate,
            isPublic: c.isPublic,
            archived: c.archived,
          })),
          entries: payload.entries.map((e) => ({
            challengeId: e.challengeId,
            date: e.date,
            count: e.count,
            note: e.note,
            sets: e.sets,
            feeling: e.feeling,
          })),
        });
        return {
          success: true,
          challengesImported: result.challengesCreated,
          entriesImported: result.entriesCreated,
        };
      } catch (e) {
        return {
          success: false,
          challengesImported: 0,
          entriesImported: 0,
          errors: [`Import failed: ${e}`],
        };
      }
    },
    [bulkImportMutation]
  );

  const clearAll = useCallback(async (): Promise<void> => {
    await clearAllMutation({});
  }, [clearAllMutation]);

  return {
    isReady,
    mode: "synced",
    challenges: transformedChallenges,
    isLoadingChallenges: challenges === undefined,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    getEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    exportAll,
    importAll,
    clearAll,
  };
}

// =============================================================================
// Main Hook
// =============================================================================

/**
 * Hook that returns the appropriate data store based on app mode.
 *
 * Usage:
 * ```tsx
 * const { challenges, createChallenge, mode } = useDataStore();
 * ```
 */
export function useDataStore(): DataStoreHook {
  const { mode, isReady } = useAppMode();

  // We need to call both hooks unconditionally (rules of hooks)
  // but only use the appropriate one based on mode
  const localStore = useLocalDataStore();
  const syncedStore = useSyncedDataStore();

  // Return based on mode
  if (!isReady) {
    return {
      isReady: false,
      mode: null,
      challenges: undefined,
      isLoadingChallenges: true,
      createChallenge: async () => {
        throw new Error("Store not ready");
      },
      updateChallenge: async () => {
        throw new Error("Store not ready");
      },
      deleteChallenge: async () => {
        throw new Error("Store not ready");
      },
      getEntries: async () => [],
      createEntry: async () => {
        throw new Error("Store not ready");
      },
      updateEntry: async () => {
        throw new Error("Store not ready");
      },
      deleteEntry: async () => {
        throw new Error("Store not ready");
      },
      exportAll: async () => {
        throw new Error("Store not ready");
      },
      importAll: async () => ({
        success: false,
        challengesImported: 0,
        entriesImported: 0,
        errors: ["Store not ready"],
      }),
      clearAll: async () => {
        throw new Error("Store not ready");
      },
    };
  }

  return mode === "local-only" ? localStore : syncedStore;
}
