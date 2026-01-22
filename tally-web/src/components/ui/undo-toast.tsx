"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface UndoToastProps {
  message: string;
  onUndo: () => Promise<void>;
  onDismiss: () => void;
  duration?: number; // ms before auto-dismiss
}

/**
 * Toast notification with undo action.
 * Auto-dismisses after duration (default 5s).
 * Follows design philosophy: clear feedback, tactile interaction.
 */
export function UndoToast({
  message,
  onUndo,
  onDismiss,
  duration = 5000,
}: UndoToastProps) {
  const [isRestoring, setIsRestoring] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Auto-dismiss timer with progress
  useEffect(() => {
    startTimeRef.current = Date.now();
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (remaining <= 0) {
        onDismiss();
      } else {
        timerRef.current = setTimeout(updateProgress, 50);
      }
    };
    
    timerRef.current = setTimeout(updateProgress, 50);
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [duration, onDismiss]);

  const handleUndo = useCallback(async () => {
    if (isRestoring) return;
    
    // Stop the timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    setIsRestoring(true);
    try {
      await onUndo();
      onDismiss();
    } catch {
      // On error, just dismiss - the item is already "deleted" from view
      onDismiss();
    }
  }, [isRestoring, onUndo, onDismiss]);

  return (
    <div
      className="
        fixed bottom-6 left-1/2 -translate-x-1/2 z-[1500]
        animate-slide-up
      "
      role="alert"
      aria-live="polite"
    >
      <div className="bg-ink text-paper rounded-xl shadow-lg overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-4">
          <span className="text-sm font-medium">{message}</span>
          <button
            onClick={handleUndo}
            disabled={isRestoring}
            className="
              px-3 py-1.5 rounded-lg text-sm font-semibold
              bg-paper/20 hover:bg-paper/30 text-paper
              transition-colors disabled:opacity-50
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper
            "
          >
            {isRestoring ? "Restoring..." : "Undo"}
          </button>
          <button
            onClick={onDismiss}
            className="
              w-6 h-6 rounded flex items-center justify-center
              text-paper/60 hover:text-paper hover:bg-paper/10
              transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper
            "
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-paper/10">
          <div
            className="h-full bg-accent transition-all ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Hook for managing undo toasts
export interface UndoItem {
  id: string;
  type: "challenge" | "entry";
  message: string;
}

export function useUndoToast() {
  const [undoItem, setUndoItem] = useState<UndoItem | null>(null);

  const showUndo = useCallback((item: UndoItem) => {
    setUndoItem(item);
  }, []);

  const hideUndo = useCallback(() => {
    setUndoItem(null);
  }, []);

  return { undoItem, showUndo, hideUndo };
}

export default UndoToast;
