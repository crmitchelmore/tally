"use client";

import { useMemo, useState } from "react";
import type { Entry, Challenge } from "@/app/api/v1/_lib/types";
import { TallyMark } from "@/components/ui/tally-mark";

export interface WeeklySummaryProps {
  entries: Entry[];
  challenges: Map<string, Challenge>;
  open: boolean;
  onClose: () => void;
}

interface WeekData {
  weekStart: Date;
  weekEnd: Date;
  totalCount: number;
  daysActive: number;
  byChallenge: Map<string, number>;
  byDay: Map<string, number>;
}

/**
 * Weekly summary modal with week navigation.
 * Shows marks logged, challenges worked on, and daily breakdown.
 */
export function WeeklySummary({ entries, challenges, open, onClose }: WeeklySummaryProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  // Get week boundaries
  const weekData = useMemo((): WeekData | null => {
    const now = new Date();
    const startOfWeek = new Date(now);
    // Go to Monday of current week
    const dayOfWeek = startOfWeek.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(startOfWeek.getDate() - daysFromMonday - (weekOffset * 7));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekStartStr = startOfWeek.toISOString().split("T")[0];
    const weekEndStr = endOfWeek.toISOString().split("T")[0];

    // Filter entries for this week
    const weekEntries = entries.filter((e) => e.date >= weekStartStr && e.date <= weekEndStr);

    const totalCount = weekEntries.reduce((sum, e) => sum + e.count, 0);
    
    const byChallenge = new Map<string, number>();
    const byDay = new Map<string, number>();
    
    weekEntries.forEach((e) => {
      byChallenge.set(e.challengeId, (byChallenge.get(e.challengeId) || 0) + e.count);
      byDay.set(e.date, (byDay.get(e.date) || 0) + e.count);
    });

    return {
      weekStart: startOfWeek,
      weekEnd: endOfWeek,
      totalCount,
      daysActive: byDay.size,
      byChallenge,
      byDay,
    };
  }, [entries, weekOffset]);

  if (!open || !weekData) return null;

  const formatWeekRange = (): string => {
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    const start = weekData.weekStart.toLocaleDateString("en-US", options);
    const end = weekData.weekEnd.toLocaleDateString("en-US", options);
    const year = weekData.weekStart.getFullYear();
    return `${start} – ${end}, ${year}`;
  };

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  // Generate day data for the week
  const dayData = dayLabels.map((label, i) => {
    const date = new Date(weekData.weekStart);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    const count = weekData.byDay.get(dateStr) || 0;
    const isToday = dateStr === new Date().toISOString().split("T")[0];
    return { label, date: dateStr, count, isToday };
  });

  const maxDayCount = Math.max(...dayData.map((d) => d.count), 1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div 
        className="relative bg-paper border border-border rounded-2xl w-full max-w-md shadow-lg animate-dialog-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="weekly-summary-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 id="weekly-summary-title" className="text-lg font-semibold text-ink">
            Weekly Summary
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted hover:text-ink hover:bg-border/50 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Week navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="p-2 rounded-lg text-muted hover:text-ink hover:bg-border/50 transition-colors"
            aria-label="Previous week"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <span className="text-sm font-medium text-ink">
            {formatWeekRange()}
            {weekOffset === 0 && (
              <span className="ml-2 text-xs text-accent">(This week)</span>
            )}
          </span>
          
          <button
            onClick={() => setWeekOffset((o) => Math.max(0, o - 1))}
            disabled={weekOffset === 0}
            className="p-2 rounded-lg text-muted hover:text-ink hover:bg-border/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next week"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Overview stats */}
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-semibold text-ink tabular-nums">
                {weekData.totalCount.toLocaleString()}
              </p>
              <p className="text-sm text-muted">marks logged</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-semibold text-ink tabular-nums">
                {weekData.daysActive}
              </p>
              <p className="text-sm text-muted">days active</p>
            </div>
          </div>

          {/* Tally visualization */}
          {weekData.totalCount > 0 && weekData.totalCount <= 50 && (
            <div className="flex justify-center">
              <TallyMark count={weekData.totalCount} size="md" />
            </div>
          )}

          {/* Daily breakdown */}
          <div>
            <h3 className="text-sm font-medium text-muted mb-3">Daily breakdown</h3>
            <div className="flex gap-1">
              {dayData.map((day) => (
                <div key={day.date} className="flex-1 text-center">
                  <div
                    className={`h-16 rounded-lg flex items-end justify-center pb-1 transition-colors ${
                      day.isToday ? "ring-2 ring-accent ring-offset-1" : ""
                    }`}
                    style={{
                      backgroundColor: day.count === 0
                        ? "var(--color-border)"
                        : `color-mix(in oklch, var(--color-accent) ${Math.round((day.count / maxDayCount) * 80 + 20)}%, var(--color-border))`,
                    }}
                  >
                    {day.count > 0 && (
                      <span className="text-xs font-medium text-white/90 tabular-nums">
                        {day.count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-1">{day.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* By challenge */}
          {weekData.byChallenge.size > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted mb-3">By challenge</h3>
              <div className="space-y-2">
                {Array.from(weekData.byChallenge.entries())
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([challengeId, count]) => {
                    const challenge = challenges.get(challengeId);
                    return (
                      <div
                        key={challengeId}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          {challenge && (
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: challenge.color }}
                            />
                          )}
                          <span className="text-sm text-ink truncate max-w-[180px]">
                            {challenge?.name || "Unknown"}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-ink tabular-nums">
                          {count.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {weekData.totalCount === 0 && (
            <div className="text-center py-6">
              <p className="text-muted">No entries this week.</p>
              <p className="text-sm text-muted mt-1">
                {weekOffset === 0 ? "Start logging to see your progress!" : "Try a different week."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WeeklySummary;
