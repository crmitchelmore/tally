"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface ClearDataProps {
  onClearComplete?: () => void;
}

/**
 * Clear all user data with confirmation.
 * Dangerous action requires explicit confirmation.
 */
export function ClearData({ onClearComplete }: ClearDataProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    challenges: number;
    entries: number;
    follows: number;
  } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (showConfirm) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [showConfirm]);

  const handleClear = useCallback(async () => {
    if (confirmText.toLowerCase() !== "delete") return;

    setClearing(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/data", {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to clear data");
      }

      const data = await res.json();
      setResult(data.deleted);
      setShowConfirm(false);
      setConfirmText("");
      onClearComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear data");
    } finally {
      setClearing(false);
    }
  }, [confirmText, onClearComplete]);

  const handleClose = useCallback(() => {
    setShowConfirm(false);
    setConfirmText("");
    setError(null);
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-ink">Clear All Data</h3>
        <p className="text-sm text-muted mt-1">
          Permanently delete all your challenges, entries, and follows.
        </p>
      </div>

      <button
        onClick={() => setShowConfirm(true)}
        className="
          px-4 py-2.5 rounded-xl border border-error/50
          text-sm font-medium text-error
          hover:bg-error/10 transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error
        "
      >
        Clear All Data
      </button>

      {result && (
        <div className="p-3 rounded-xl bg-muted/10 border border-border text-muted text-sm">
          Cleared {result.challenges} challenge{result.challenges !== 1 ? "s" : ""},{" "}
          {result.entries} entr{result.entries !== 1 ? "ies" : "y"}, and{" "}
          {result.follows} follow{result.follows !== 1 ? "s" : ""}.
        </div>
      )}

      {/* Confirmation dialog */}
      <dialog
        ref={dialogRef}
        className="
          fixed inset-0 z-[1500] m-auto p-0
          w-full max-w-md
          bg-transparent backdrop:bg-ink/40 backdrop:backdrop-blur-sm
          open:animate-dialog-in
        "
      >
        <div className="bg-surface rounded-2xl shadow-xl border border-border overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-error">
              Delete all data?
            </h2>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-muted">
              This will permanently delete all your challenges, entries, and follows.
              This action cannot be undone.
            </p>

            <div>
              <label
                htmlFor="confirm-delete"
                className="block text-sm font-medium text-ink mb-2"
              >
                Type <span className="font-semibold text-error">delete</span> to confirm
              </label>
              <input
                id="confirm-delete"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="delete"
                autoComplete="off"
                className="
                  w-full px-4 py-3 rounded-xl border border-border
                  bg-paper text-ink placeholder:text-muted/50
                  focus:outline-none focus:ring-2 focus:ring-error focus:border-transparent
                "
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex gap-3 justify-end">
            <button
              onClick={handleClose}
              disabled={clearing}
              className="
                px-4 py-2 rounded-lg text-sm font-medium text-ink
                hover:bg-border/50 transition-colors
              "
            >
              Cancel
            </button>
            <button
              onClick={handleClear}
              disabled={clearing || confirmText.toLowerCase() !== "delete"}
              className="
                px-4 py-2 rounded-lg text-sm font-medium
                bg-error text-white hover:bg-error/90 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {clearing ? (
                <span className="inline-flex items-center gap-2">
                  <LoadingSpinner />
                  Deleting...
                </span>
              ) : (
                "Delete All Data"
              )}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export default ClearData;
