"use client";

import { useState } from "react";
import { PublicChallengesList } from "./public-challenges-list";

export interface CommunitySectionProps {
  onRefresh?: () => void;
}

/**
 * Community section with expandable public challenges view.
 * Provides access to browse and follow public challenges.
 */
export function CommunitySection({ onRefresh }: CommunitySectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Community</h2>
        <button
          onClick={() => setExpanded(!expanded)}
          className="
            px-3 py-1.5 rounded-lg text-sm font-medium
            text-muted hover:text-ink hover:bg-border/50
            transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
          "
        >
          {expanded ? "Hide" : "Browse public challenges"}
        </button>
      </div>

      {expanded && (
        <div className="bg-paper/50 border border-border rounded-2xl p-4">
          <PublicChallengesList onRefresh={onRefresh} />
        </div>
      )}

      {!expanded && (
        <div className="bg-surface border border-border rounded-2xl p-6 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-border/30 text-muted mb-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <p className="text-ink font-medium text-sm">Discover public challenges</p>
          <p className="text-muted text-xs mt-1">
            Follow challenges from other users and track their progress.
          </p>
        </div>
      )}
    </section>
  );
}

export default CommunitySection;
