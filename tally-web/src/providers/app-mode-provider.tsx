"use client";

/**
 * App Mode Provider
 *
 * Provides app mode context (local-only vs synced) to the application.
 * Handles hydration mismatches and SSR gracefully.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { AppMode } from "@tally/shared-types";
import {
  getAppModeStore,
  getLocalDataStore,
} from "@/lib/local-storage";

// =============================================================================
// Context Types
// =============================================================================

interface AppModeContextValue {
  /** Current app mode, null if not yet determined (first render or SSR) */
  mode: AppMode | null;
  /** Whether mode has been determined (for hydration) */
  isReady: boolean;
  /** Whether app is in local-only mode */
  isLocalOnly: boolean;
  /** Whether app is in synced mode */
  isSynced: boolean;
  /** Whether user has chosen a mode (vs. first-time user) */
  hasChosenMode: boolean;
  /** Set the app mode */
  setMode: (mode: AppMode) => void;
  /** Check if there's local data that could be migrated */
  hasLocalData: () => Promise<boolean>;
  /** Get counts of local data */
  getLocalDataCounts: () => Promise<{
    challengeCount: number;
    entryCount: number;
  }>;
}

const AppModeContext = createContext<AppModeContextValue | null>(null);

// =============================================================================
// External Store for Mode (avoids setState in useEffect)
// =============================================================================

let modeListeners: Array<() => void> = [];
let currentModeSnapshot: AppMode | null = null;

function subscribeToMode(callback: () => void) {
  modeListeners.push(callback);
  return () => {
    modeListeners = modeListeners.filter((l) => l !== callback);
  };
}

function getModeSnapshot(): AppMode | null {
  if (typeof window === "undefined") return null;
  if (currentModeSnapshot === null) {
    currentModeSnapshot = getAppModeStore().getMode();
  }
  return currentModeSnapshot;
}

function getServerModeSnapshot(): AppMode | null {
  return null;
}

function updateMode(newMode: AppMode) {
  const store = getAppModeStore();
  store.setMode(newMode);
  currentModeSnapshot = newMode;
  modeListeners.forEach((l) => l());
}

// =============================================================================
// Provider Component
// =============================================================================

interface AppModeProviderProps {
  children: ReactNode;
}

export function AppModeProvider({ children }: AppModeProviderProps) {
  const mode = useSyncExternalStore(
    subscribeToMode,
    getModeSnapshot,
    getServerModeSnapshot
  );
  
  // Track readiness - we're ready once we've had a chance to read localStorage
  const [isReady, setIsReady] = useState(false);

  // Mark as ready after first client render
  useEffect(() => {
    // Defer to next tick so snapshot has been read
    const timer = setTimeout(() => setIsReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const setMode = useCallback((newMode: AppMode) => {
    updateMode(newMode);
  }, []);

  const hasLocalData = useCallback(async (): Promise<boolean> => {
    try {
      const store = getLocalDataStore();
      return await store.hasData();
    } catch {
      return false;
    }
  }, []);

  const getLocalDataCounts = useCallback(async () => {
    try {
      const store = getLocalDataStore();
      return await store.getDataCounts();
    } catch {
      return { challengeCount: 0, entryCount: 0 };
    }
  }, []);

  const value: AppModeContextValue = {
    mode,
    isReady,
    isLocalOnly: mode === "local-only",
    isSynced: mode === "synced",
    hasChosenMode: mode !== null,
    setMode,
    hasLocalData,
    getLocalDataCounts,
  };

  return (
    <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Use the app mode context
 * @throws Error if used outside of AppModeProvider
 */
export function useAppMode(): AppModeContextValue {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error("useAppMode must be used within an AppModeProvider");
  }
  return context;
}

/**
 * Safe version that returns null if used outside provider
 * Useful for components that may or may not be wrapped
 */
export function useAppModeSafe(): AppModeContextValue | null {
  return useContext(AppModeContext);
}
