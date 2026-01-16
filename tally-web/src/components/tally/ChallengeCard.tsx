"use client";

import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { Challenge, Entry } from "@/types";
import { calculateStats, formatPaceStatus } from "@/lib/stats";
import { AddEntrySheet } from "./AddEntrySheet";
import { TallyMarks } from "./marks/TallyMarks";

interface ChallengeCardProps {
  challenge: Challenge;
  onClick?: () => void;
}

export function ChallengeCard({ challenge, onClick }: ChallengeCardProps) {
  const { user } = useUser();
  const entries = useQuery(
    api.entries.listByChallenge,
    user?.id ? { clerkId: user.id, challengeId: challenge._id } : "skip"
  );

  const stats = entries ? calculateStats(challenge, entries as Entry[]) : null;
  const pace = stats ? formatPaceStatus(stats.paceStatus) : null;
  const progress = stats ? Math.min(100, (stats.total / challenge.targetNumber) * 100) : 0;

  // Determine status color based on pace
  const getStatusColor = () => {
    if (!pace) return "var(--ink-muted)";
    if (stats!.paceStatus === "ahead") return "var(--success)";
    if (stats!.paceStatus === "onPace") return "var(--ink)";
    return "var(--slash)";
  };

  return (
    <article
      className="card card-hover group cursor-pointer"
      onClick={onClick}
    >
      {/* Header with icon and quick-add */}
      <header className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center text-xl shrink-0"
            style={{ 
              backgroundColor: challenge.color + "15",
              color: challenge.color 
            }}
          >
            {challenge.icon}
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg text-[var(--ink)] truncate">
              {challenge.name}
            </h3>
            {pace && (
              <p 
                className="text-sm mt-0.5"
                style={{ color: getStatusColor() }}
              >
                {pace.text}
              </p>
            )}
          </div>
        </div>
        
        <AddEntrySheet 
          challengeId={challenge._id}
          trigger={
            <button 
              className="btn btn-secondary opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              + Add
            </button>
          }
        />
      </header>

      {/* Tally marks visualization */}
      <div className="mb-6 py-4 px-3 bg-[var(--paper-warm)] rounded-lg min-h-[60px] flex items-center">
        {stats && stats.total > 0 ? (
          <TallyMarks 
            count={stats.total} 
            size="md" 
            color={challenge.color}
            maxDisplay={35}
          />
        ) : (
          <span className="text-[var(--ink-faint)] text-sm">No entries yet</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex justify-between items-baseline mb-2">
          <span className="stat-value" style={{ fontSize: 'var(--text-2xl)' }}>
            {stats?.total ?? 0}
          </span>
          <span className="text-[var(--ink-muted)] text-sm">
            of {challenge.targetNumber}
          </span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ 
              width: `${progress}%`,
              backgroundColor: challenge.color 
            }}
          />
        </div>
      </div>

      {/* Compact stats row */}
      {stats && (
        <footer className="flex items-center justify-between pt-4 border-t border-[var(--border-light)]">
          <div className="text-center">
            <p className="text-xl font-display">{stats.daysLeft}</p>
            <p className="stat-label">Days left</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-display">{stats.currentStreak}</p>
            <p className="stat-label">Streak</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-display">{stats.requiredPerDay.toFixed(1)}</p>
            <p className="stat-label">Per day</p>
          </div>
        </footer>
      )}
    </article>
  );
}
