"use client";

import { useState, useCallback } from "react";
import { TallyMark } from "@/components/ui/tally-mark";
import type { Entry } from "@/app/api/v1/_lib/types";

export interface EntryListProps {
  entries: Entry[];
  loading?: boolean;
  onEdit?: (entry: Entry) => void;
  onDelete?: (entry: Entry) => void;
  className?: string;
}

const FEELING_LABELS = {
  great: { icon: "✦", label: "Great" },
  good: { icon: "○", label: "Good" },
  okay: { icon: "·", label: "Okay" },
  tough: { icon: "—", label: "Tough" },
};

/**
 * List of entries for a challenge, grouped by date.
 * Supports edit and delete actions.
 */
export function EntryList({
  entries,
  loading = false,
  onEdit,
  onDelete,
  className = "",
}: EntryListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Group entries by date
  const groupedEntries = entries.reduce<Record<string, Entry[]>>((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {});

  // Sort dates descending (most recent first)
  const sortedDates = Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a));

  // Handle delete with confirmation
  const handleDelete = useCallback(
    async (entry: Entry) => {
      if (!onDelete) return;
      setDeletingId(entry.id);
      try {
        await onDelete(entry);
      } finally {
        setDeletingId(null);
      }
    },
    [onDelete]
  );

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 w-24 bg-border rounded mb-2" />
            <div className="h-16 bg-border/50 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <TallyMark count={0} size="lg" className="opacity-30 mb-4" />
        <p className="text-muted">No entries yet</p>
        <p className="text-sm text-muted/60 mt-1">Add your first entry to get started</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {sortedDates.map((date) => {
        const dayEntries = groupedEntries[date];
        const dayTotal = dayEntries.reduce((sum, e) => sum + e.count, 0);
        const formattedDate = formatDate(date);

        return (
          <div key={date}>
            {/* Date header */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted">{formattedDate}</h3>
              <span className="text-sm tabular-nums text-ink font-medium">
                {dayTotal} total
              </span>
            </div>

            {/* Entries for this date */}
            <div className="space-y-2">
              {dayEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="
                    flex items-start gap-4 p-4 rounded-xl
                    bg-surface border border-border
                    hover:border-muted/50 transition-colors
                  "
                >
                  {/* Tally mark preview */}
                  <div className="flex-shrink-0 pt-1">
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
                      <p className="text-sm text-muted mt-1 line-clamp-2">{entry.note}</p>
                    )}
                    <p className="text-xs text-muted/60 mt-1">
                      {formatTime(entry.createdAt)}
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
                          onClick={() => handleDelete(entry)}
                          disabled={deletingId === entry.id}
                          className="
                            w-8 h-8 rounded-lg flex items-center justify-center
                            text-muted hover:text-error hover:bg-error/10
                            transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
                            disabled:opacity-50
                          "
                          aria-label="Delete entry"
                        >
                          {deletingId === entry.id ? (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Format date for display */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Format timestamp for display */
function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default EntryList;
