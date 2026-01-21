"use client";

import { memo } from "react";
import { TallyDisplay } from "./tally-display";

export interface TallyMarkProps {
  /** The count to display (0 to 10000+) */
  count: number;
  /** Animate stroke drawing on count change */
  animated?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
  /** Accessible label (defaults to count) */
  "aria-label"?: string;
}

/**
 * Fractal Completion Tallies Component
 *
 * This is a convenience wrapper around TallyDisplay for backward compatibility.
 * Use TallyDisplay directly for new code.
 *
 * Renders tally marks that scale hierarchically:
 * - 1-4: vertical strokes
 * - 5: 4 strokes + diagonal slash (5-gate)
 * - 25: X mark (accent color)
 * - 26-99: Xs in 2x2 grid positions
 * - 100: box outline (muted) with 4 Xs (accent)
 * - 1000: row of boxes with horizontal line (accent)
 */
export const TallyMark = memo(function TallyMark({
  count,
  animated = false,
  size = "md",
  className = "",
  "aria-label": ariaLabel,
}: TallyMarkProps) {
  return (
    <TallyDisplay
      count={count}
      size={size}
      className={className}
    />
  );
});

export default TallyMark;
