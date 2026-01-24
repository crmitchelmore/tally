"use client";

import type { PersonalRecords as PersonalRecordsType } from "@/app/api/v1/_lib/types";

export interface PersonalRecordsProps {
  records: PersonalRecordsType | null;
  loading?: boolean;
  challengeNames?: Map<string, string>;
}

/**
 * Personal records panel showing user's best achievements.
 * Updates after entry changes.
 */
export function PersonalRecords({ records, loading, challengeNames }: PersonalRecordsProps) {
  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 animate-pulse">
        <div className="h-5 w-32 bg-border/50 rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>
              <div className="h-3 w-20 bg-border/50 rounded mb-1" />
              <div className="h-6 w-16 bg-border/50 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!records) {
    return null;
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getChallengeName = (id: string): string => {
    return challengeNames?.get(id) || "Challenge";
  };

  // If no records yet
  const hasAnyRecords = 
    records.bestSingleDay ||
    records.longestStreak > 0 ||
    records.highestDailyAverage ||
    records.mostActiveDays > 0 ||
    records.biggestSingleEntry ||
    records.bestSet ||
    records.avgSetValue;

  if (!hasAnyRecords) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-ink mb-4">Personal Records</h3>
        <p className="text-sm text-muted">
          Log some entries to start tracking your records!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <h3 className="text-lg font-semibold text-ink mb-4">Personal Records</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* Best single day */}
        {records.bestSingleDay && (
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Best day</p>
            <p className="text-xl font-semibold text-ink tabular-nums">
              {records.bestSingleDay.count.toLocaleString()}
            </p>
            <p className="text-xs text-muted">{formatDate(records.bestSingleDay.date)}</p>
          </div>
        )}

        {/* Longest streak */}
        {records.longestStreak > 0 && (
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Longest streak</p>
            <p className="text-xl font-semibold text-ink tabular-nums">
              {records.longestStreak} <span className="text-sm font-normal">days</span>
            </p>
          </div>
        )}

        {/* Most active days */}
        {records.mostActiveDays > 0 && (
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Active days</p>
            <p className="text-xl font-semibold text-ink tabular-nums">
              {records.mostActiveDays}
            </p>
          </div>
        )}

        {/* Highest daily average */}
        {records.highestDailyAverage && (
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Best daily avg</p>
            <p className="text-xl font-semibold text-ink tabular-nums">
              {records.highestDailyAverage.average.toFixed(1)}
            </p>
            <p className="text-xs text-muted truncate">
              {getChallengeName(records.highestDailyAverage.challengeId)}
            </p>
          </div>
        )}

        {/* Biggest single entry */}
        {records.biggestSingleEntry && (
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Biggest entry</p>
            <p className="text-xl font-semibold text-ink tabular-nums">
              {records.biggestSingleEntry.count.toLocaleString()}
            </p>
            <p className="text-xs text-muted truncate">
              {getChallengeName(records.biggestSingleEntry.challengeId)}
            </p>
          </div>
        )}

        {/* Best set - for sets-based challenges */}
        {records.bestSet && (
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Best set</p>
            <p className="text-xl font-semibold text-accent tabular-nums">
              {records.bestSet.value.toLocaleString()}
            </p>
            <p className="text-xs text-muted">{formatDate(records.bestSet.date)}</p>
          </div>
        )}

        {/* Average set value */}
        {records.avgSetValue != null && (
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Avg set</p>
            <p className="text-xl font-semibold text-ink tabular-nums">
              {records.avgSetValue.toFixed(1)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PersonalRecords;
