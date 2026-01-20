"use client";

import { TallyMark } from "@/components/ui/tally-mark";
import Link from "next/link";
import type { Challenge, ChallengeStats } from "@/app/api/v1/_lib/types";

export interface ChallengeCardProps {
  challenge: Challenge;
  stats: ChallengeStats;
  className?: string;
}

/**
 * Challenge card displaying progress, target, pace status, and mini tally marks.
 * Designed for the dashboard grid view.
 */
export function ChallengeCard({ challenge, stats, className = "" }: ChallengeCardProps) {
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

  return (
    <Link
      href={`/app/challenges/${challenge.id}`}
      className={`
        block bg-surface border border-border rounded-2xl p-5
        hover:border-accent/30 transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Color indicator */}
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
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
      
      {/* Mini tally preview */}
      <div className="mt-4 pt-4 border-t border-border">
        <TallyMark count={Math.min(stats.totalCount, 25)} size="sm" />
      </div>
    </Link>
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
