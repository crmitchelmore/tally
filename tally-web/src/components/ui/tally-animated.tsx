"use client";

import { memo } from "react";
import { TallyDisplay } from "./tally-display";

export interface TallyAnimatedProps {
  /** Current count */
  count: number;
  /** Maximum count for the challenge */
  maxCount?: number;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Color for strokes */
  color?: string;
  /** Additional CSS classes */
  className?: string;
}

/** Entry feedback and cards use the same hand-drawn marks and reduced-motion rules. */
export const TallyAnimated = memo(function TallyAnimated({ count, maxCount, size = "md", color, className = "" }: TallyAnimatedProps) {
  return <div className={className} role="img" aria-label={`${count} tallies${maxCount ? ` of ${maxCount}` : ""}`}>
    <div aria-hidden="true"><TallyDisplay count={count} size={size} color={color} /></div>
    {count === 0 && <span className="text-muted text-sm">Add your first tally</span>}
  </div>;
});

export default TallyAnimated;
