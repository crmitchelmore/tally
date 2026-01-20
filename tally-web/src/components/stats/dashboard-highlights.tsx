"use client";

import { TallyMark } from "@/components/ui/tally-mark";
import type { DashboardStats } from "@/app/api/v1/_lib/types";

export interface DashboardHighlightsProps {
  stats: DashboardStats | null;
  loading?: boolean;
}

/**
 * Dashboard highlights showing total marks, today, best streak, and pace status.
 * Provides a fast-scan overview of user's progress.
 */
export function DashboardHighlights({ stats, loading }: DashboardHighlightsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4 animate-pulse">
            <div className="h-4 w-16 bg-border/50 rounded mb-2" />
            <div className="h-8 w-20 bg-border/50 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const paceConfig = {
    ahead: { label: "Ahead", color: "text-success", bg: "bg-success/10" },
    "on-pace": { label: "On Pace", color: "text-ink", bg: "bg-border/30" },
    behind: { label: "Behind", color: "text-warning", bg: "bg-warning/10" },
    none: { label: "—", color: "text-muted", bg: "bg-border/30" },
  };

  const pace = paceConfig[stats.overallPaceStatus];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {/* Total marks */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <p className="text-sm text-muted mb-1">Total marks</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-ink tabular-nums">
            {stats.totalMarks.toLocaleString()}
          </span>
          {stats.totalMarks > 0 && stats.totalMarks <= 25 && (
            <TallyMark count={Math.min(stats.totalMarks, 5)} size="sm" />
          )}
        </div>
      </div>

      {/* Today */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <p className="text-sm text-muted mb-1">Today</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-ink tabular-nums">
            {stats.today.toLocaleString()}
          </span>
          {stats.today > 0 && stats.today <= 10 && (
            <TallyMark count={Math.min(stats.today, 5)} size="sm" />
          )}
        </div>
      </div>

      {/* Best streak */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <p className="text-sm text-muted mb-1">Best streak</p>
        <span className="text-2xl font-semibold text-ink tabular-nums">
          {stats.bestStreak} <span className="text-base font-normal text-muted">days</span>
        </span>
      </div>

      {/* Overall pace */}
      <div className={`border border-border rounded-xl p-4 ${pace.bg}`}>
        <p className="text-sm text-muted mb-1">Overall pace</p>
        <span className={`text-2xl font-semibold ${pace.color}`}>
          {pace.label}
        </span>
      </div>
    </div>
  );
}

export default DashboardHighlights;
