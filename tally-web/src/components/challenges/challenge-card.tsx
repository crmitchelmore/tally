"use client";

import { TallyDisplay } from "@/components/ui/tally-display";
import { ActivityHeatmap } from "@/components/challenges/activity-heatmap";
import Link from "next/link";
import type { Challenge, ChallengeStats, Entry } from "@/app/api/v1/_lib/types";
import { getIconEmoji } from "@/lib/challenge-icons";

export interface ChallengeCardProps {
  challenge: Challenge;
  stats: ChallengeStats;
  entries?: Entry[];
  className?: string;
  onQuickAdd?: (challengeId: string) => void;
  href?: string | null; // null = no link, undefined = default link
}

/**
 * Challenge card displaying progress, target, pace status, and mini tally marks.
 * Designed for the dashboard grid view.
 */
export function ChallengeCard({
  challenge,
  stats,
  entries = [],
  className = "",
  onQuickAdd,
  href,
}: ChallengeCardProps) {
  const progress = Math.min(100, (stats.totalCount / challenge.target) * 100);
  
  const paceColors = {
    ahead: "text-success",
    "on-pace": "text-muted",
    behind: "text-warning",
  };
  
  const paceLabels = {
    ahead: "Ahead",
    "on-pace": "On pace",
    behind: "Behind",
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickAdd) {
      onQuickAdd(challenge.id);
    }
  };

  const cardClasses = `
    block bg-surface border border-border rounded-2xl p-5 pr-16
    hover:border-accent/30 transition-colors
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
  `;

  const cardContent = (
    <>
      <div className="flex items-start justify-between gap-4">
        {/* Left: Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Icon */}
            <span className="text-lg" aria-hidden="true">
              {getIconEmoji(challenge.icon)}
            </span>
            {/* Color indicator */}
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: challenge.color }}
              aria-hidden="true"
            />
            <h3 className="font-semibold text-ink truncate">{challenge.name}</h3>
            {challenge.isPublic && (
              <span className="text-xs text-muted px-1.5 py-0.5 bg-border/50 rounded-full">
                Public
              </span>
            )}
          </div>
          
          {/* Progress text */}
          <p className="mt-2 text-2xl font-semibold text-ink tabular-nums">
            {stats.totalCount.toLocaleString()}
            <span className="text-muted text-base font-normal">
              {" / "}
              {challenge.target.toLocaleString()}
              {challenge.unitLabel && (
                <span className="text-sm ml-1">{challenge.unitLabel}</span>
              )}
            </span>
          </p>
          
          {/* Pace status */}
          <p className={`mt-1 text-sm ${paceColors[stats.paceStatus]}`}>
            {paceLabels[stats.paceStatus]}
            {stats.daysRemaining > 0 && (
              <span className="text-muted">
                {" · "}{stats.daysRemaining} days left
              </span>
            )}
          </p>
        </div>
        
        {/* Right: Progress ring */}
        <div className="flex-shrink-0">
          <ProgressRing
            progress={progress}
            color={challenge.color}
            size={56}
          />
        </div>
      </div>
      
      {/* Mini tally preview + heatmap */}
      <div className="mt-4 pt-4 border-t border-border space-y-3">
        <TallyDisplay count={stats.totalCount} size="sm" />
        {entries.length > 0 && (
          <div className="overflow-hidden max-w-full">
            <ActivityHeatmap
              entries={entries}
              startDate={challenge.startDate}
              endDate={challenge.endDate}
              color={challenge.color}
              unitLabel={challenge.unitLabel || "marks"}
            />
          </div>
        )}
      </div>
    </>
  );

  // Determine the actual href
  const actualHref = href === undefined ? `/app/challenges/${challenge.id}` : href;

  return (
    <div className={`relative ${className}`}>
      {actualHref ? (
        <Link href={actualHref} className={cardClasses}>
          {cardContent}
        </Link>
      ) : (
        <div className={cardClasses}>
          {cardContent}
        </div>
      )}
      
      {/* Quick add button - floating on top */}
      {onQuickAdd && (
        <button
          onClick={handleQuickAdd}
          className="absolute top-4 right-4 w-11 h-11 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent/90 transition-colors shadow-md z-10"
          aria-label={`Add 1 ${challenge.unitLabel || "rep"}`}
          title={`+1 ${challenge.unitLabel || ""}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  );
}

/** Circular progress ring */
function ProgressRing({
  progress,
  color,
  size = 56,
}: {
  progress: number;
  color: string;
  size?: number;
}) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="transform -rotate-90"
      aria-hidden="true"
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-border"
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-300"
      />
    </svg>
  );
}

export default ChallengeCard;
