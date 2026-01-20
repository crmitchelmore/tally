"use client";

import { useEffect, useRef, useCallback } from "react";
import { TallyMark } from "@/components/ui/tally-mark";
import type { Entry } from "@/app/api/v1/_lib/types";

export interface DayDrilldownProps {
  date: string;
  entries: Entry[];
  open: boolean;
  onClose: () => void;
  onEdit?: (entry: Entry) => void;
  onDelete?: (entry: Entry) => void;
  onAddEntry?: () => void;
}

const FEELING_LABELS = {
  great: { icon: "✦", label: "Great" },
  good: { icon: "○", label: "Good" },
  okay: { icon: "·", label: "Okay" },
  tough: { icon: "—", label: "Tough" },
};

/**
 * Day drilldown sheet showing all entries for a specific date.
 * Accessed via heatmap day click.
 */
export function DayDrilldown({
  date,
  entries,
  open,
  onClose,
  onEdit,
  onDelete,
  onAddEntry,
}: DayDrilldownProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Total for the day
  const dayTotal = entries.reduce((sum, e) => sum + e.count, 0);

  // Format date for display
  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Check if date is today or in the past (can add entries)
  const today = new Date().toISOString().split("T")[0];
  const canAddEntry = date <= today;

  // Open/close dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  // Handle click outside
  const handleDialogClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      className="
        fixed inset-0 z-[1400] m-auto
        w-full max-w-lg p-0
        bg-transparent backdrop:bg-ink/40 backdrop:backdrop-blur-sm
        open:animate-dialog-in
      "
    >
      <div className="bg-surface rounded-2xl shadow-xl border border-border overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-ink">{formattedDate}</h2>
            <p className="text-sm text-muted">
              {dayTotal} {dayTotal === 1 ? "mark" : "marks"} logged
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="
              w-8 h-8 rounded-full flex items-center justify-center
              text-muted hover:text-ink hover:bg-border/50
              transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
            "
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Day total visualization */}
          <div className="text-center mb-6 pb-6 border-b border-border">
            <TallyMark count={Math.min(dayTotal, 50)} size="lg" />
            <p className="mt-3 text-3xl font-semibold text-ink tabular-nums">{dayTotal}</p>
            <p className="text-sm text-muted">{dayTotal === 1 ? "mark" : "marks"} this day</p>
          </div>

          {/* Entries list */}
          {entries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted">No entries on this day</p>
              {canAddEntry && onAddEntry && (
                <button
                  type="button"
                  onClick={onAddEntry}
                  className="
                    mt-4 px-4 py-2 rounded-xl
                    bg-accent text-white font-medium
                    hover:bg-accent/90 transition-colors
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
                  "
                >
                  Add an entry
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="
                    flex items-start gap-4 p-4 rounded-xl
                    bg-paper border border-border
                  "
                >
                  {/* Tally preview */}
                  <div className="flex-shrink-0 pt-0.5">
                    <TallyMark count={Math.min(entry.count, 10)} size="sm" />
                  </div>

                  {/* Entry details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-semibold text-ink tabular-nums">
                        {entry.count}
                      </span>
                      <span className="text-sm text-muted">
                        {entry.count === 1 ? "mark" : "marks"}
                      </span>
                      {entry.feeling && (
                        <span className="text-sm text-muted" title={FEELING_LABELS[entry.feeling].label}>
                          {FEELING_LABELS[entry.feeling].icon}
                        </span>
                      )}
                    </div>
                    {entry.note && (
                      <p className="text-sm text-muted mt-1">{entry.note}</p>
                    )}
                    <p className="text-xs text-muted/60 mt-1">
                      {new Date(entry.createdAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  {(onEdit || onDelete) && (
                    <div className="flex-shrink-0 flex gap-1">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(entry)}
                          className="
                            w-8 h-8 rounded-lg flex items-center justify-center
                            text-muted hover:text-ink hover:bg-border/50
                            transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
                          "
                          aria-label="Edit entry"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(entry)}
                          className="
                            w-8 h-8 rounded-lg flex items-center justify-center
                            text-muted hover:text-error hover:bg-error/10
                            transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
                          "
                          aria-label="Delete entry"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with add button */}
        {canAddEntry && onAddEntry && entries.length > 0 && (
          <div className="px-6 py-4 border-t border-border flex-shrink-0">
            <button
              type="button"
              onClick={onAddEntry}
              className="
                w-full py-3 rounded-xl
                border border-border text-ink font-medium
                hover:bg-border/50 transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
              "
            >
              Add another entry
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}

export default DayDrilldown;
