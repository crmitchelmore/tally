"use client";

import { TallyDisplay } from "@/components/ui/tally-display";
import { ActivityHeatmap } from "@/components/challenges/activity-heatmap";
import Link from "next/link";
import { getIconEmoji } from "@/lib/challenge-icons";
import type { CSSProperties } from "react";
import type { Challenge, ChallengeStats, Entry } from "@/app/api/v1/_lib/types";

export interface ChallengeCardProps {
  challenge: Challenge;
  stats: ChallengeStats;
  entries?: Entry[];
  className?: string;
  onQuickAdd?: (challengeId: string) => void;
  href?: string | null;
}

/** Shared dashboard card. FRACTAL_COMPLETION_TALLIES remain the count identity. */
export function ChallengeCard({
  challenge, stats, entries = [], className = "", onQuickAdd, href,
}: ChallengeCardProps) {
  const progress = challenge.target > 0
    ? Math.max(0, Math.min(100, (stats.totalCount / challenge.target) * 100))
    : 0;
  const paceLabels = { ahead: "Ahead of pace", "on-pace": "On pace", behind: "Behind pace" };
  const actualHref = href === undefined ? `/app/challenges/${challenge.id}` : href;
  const content = (
    <>
      <div className="challenge-card-heading">
        <span className="challenge-unit"><span className="challenge-colour" aria-hidden="true" />{challenge.unitLabel || "marks"}</span>
        {challenge.isPublic && <span className="challenge-visibility">Public</span>}
      </div>
      <h3><span className="challenge-icon" aria-hidden="true">{getIconEmoji(challenge.icon)}</span>{challenge.name}</h3>
      <p className="challenge-count"><strong>{stats.totalCount.toLocaleString()}</strong><span> / {challenge.target.toLocaleString()}</span></p>
      <div className="challenge-progress" role="progressbar" aria-label={`${challenge.name} progress`} aria-valuemin={0} aria-valuemax={challenge.target} aria-valuenow={Math.min(challenge.target, Math.max(0, stats.totalCount))} aria-valuetext={`${stats.totalCount} of ${challenge.target} ${challenge.unitLabel || "marks"}`}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="challenge-pace-row">
        <span className={`pace-label pace-${stats.paceStatus}`}>{progress >= 100 ? "Target reached" : paceLabels[stats.paceStatus]}</span>
        <span>{stats.daysRemaining > 0 ? `${stats.daysRemaining} days left` : "Period ended"}</span>
      </div>
      <div className="challenge-marks">
        {stats.totalCount > 0 ? <TallyDisplay count={stats.totalCount} size="sm" /> : <span>Your first mark is waiting.</span>}
      </div>
      {entries.length > 0 && (
        <div className="challenge-activity">
          <ActivityHeatmap entries={entries} startDate={challenge.startDate} endDate={challenge.endDate} color={challenge.color} unitLabel={challenge.unitLabel || "marks"} />
        </div>
      )}
    </>
  );
  return (
    <article className={`challenge-card ${className}`} style={{ "--challenge-colour": challenge.color } as CSSProperties}>
      {actualHref ? <Link href={actualHref} className="challenge-card-body">{content}</Link> : <div className="challenge-card-body">{content}</div>}
      {onQuickAdd && (
        <button type="button" className="challenge-log-button" onClick={() => onQuickAdd(challenge.id)} aria-label={`Log progress for ${challenge.name}`}>
          <span>Log progress</span><span aria-hidden="true">+</span>
        </button>
      )}
    </article>
  );
}

export default ChallengeCard;
