"use client";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { memo, useEffect, useRef, useState } from "react";

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
 * Renders tally marks that scale hierarchically:
 * - 1-4: vertical strokes
 * - 5: 4 strokes + diagonal slash (5-gate)
 * - 6-24: 5-gates in X layout
 * - 25: full 25-unit with X overlay
 * - 26-99: 2×2 grid of 25-units
 * - 100: collapsed X + square
 * - 101-999: row of 100-blocks
 * - 1000: 10 squares + horizontal line
 * - 1001-9999: stacked rows
 * - 10000: diagonal closure
 */
export const TallyMark = memo(function TallyMark({
  count,
  animated = false,
  size = "md",
  className = "",
  "aria-label": ariaLabel,
}: TallyMarkProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animated && !prefersReducedMotion;
  const prevCountRef = useRef(count);
  const [animatingStrokes, setAnimatingStrokes] = useState<number[]>([]);

  // Handle animation when count changes
  useEffect(() => {
    if (!shouldAnimate) return;

    const prev = prevCountRef.current;
    const diff = count - prev;
    prevCountRef.current = count;

    if (diff > 0 && diff <= 5) {
      const newStrokes = Array.from({ length: diff }, (_, i) => prev + i + 1);
      setAnimatingStrokes(newStrokes);
      const timer = setTimeout(() => setAnimatingStrokes([]), 400);
      return () => clearTimeout(timer);
    }
  }, [count, shouldAnimate]);

  const sizeClasses = {
    sm: { stroke: "w-[2px] h-4", slash: "w-[2px] h-5", gap: "gap-[3px]" },
    md: { stroke: "w-[3px] h-7", slash: "w-[3px] h-8", gap: "gap-1" },
    lg: { stroke: "w-1 h-10", slash: "w-1 h-12", gap: "gap-1.5" },
  }[size];

  // For counts > 100, use simplified rendering
  if (count >= 100) {
    return (
      <div
        className={`inline-flex items-center ${sizeClasses.gap} ${className}`}
        role="img"
        aria-label={ariaLabel ?? `${count} tallies`}
      >
        <LargeCountDisplay count={count} size={size} />
      </div>
    );
  }

  // Render 5-gates and remaining strokes
  const fiveGates = Math.floor(count / 5);
  const remainder = count % 5;

  return (
    <div
      className={`inline-flex items-end ${sizeClasses.gap} ${className}`}
      role="img"
      aria-label={ariaLabel ?? `${count} tallies`}
    >
      {Array.from({ length: fiveGates }).map((_, i) => (
        <FiveGate
          key={`gate-${i}`}
          size={size}
          shouldAnimate={shouldAnimate}
          animatingStrokes={animatingStrokes}
          baseIndex={i * 5}
        />
      ))}
      {remainder > 0 && (
        <div className={`inline-flex items-end ${sizeClasses.gap}`}>
          {Array.from({ length: remainder }).map((_, i) => {
            const strokeIndex = fiveGates * 5 + i + 1;
            const isAnimating = animatingStrokes.includes(strokeIndex);
            return (
              <Stroke
                key={`stroke-${i}`}
                size={size}
                isAnimating={isAnimating}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});

/** Single vertical stroke */
function Stroke({
  size,
  isAnimating,
}: {
  size: "sm" | "md" | "lg";
  isAnimating?: boolean;
}) {
  const sizeClass = {
    sm: "w-[2px] h-4",
    md: "w-[3px] h-7",
    lg: "w-1 h-10",
  }[size];

  return (
    <span
      className={`
        ${sizeClass} rounded-full bg-current
        ${isAnimating ? "animate-stroke-draw" : ""}
      `}
    />
  );
}

/** Diagonal slash (5th stroke, accent color) */
function Slash({
  size,
  isAnimating,
}: {
  size: "sm" | "md" | "lg";
  isAnimating?: boolean;
}) {
  const sizeClass = {
    sm: "w-[2px] h-5 -rotate-[18deg]",
    md: "w-[3px] h-8 -rotate-[18deg]",
    lg: "w-1 h-12 -rotate-[18deg]",
  }[size];

  return (
    <span
      className={`
        ${sizeClass} rounded-full bg-accent
        ${isAnimating ? "animate-stroke-draw" : ""}
      `}
    />
  );
}

/** 5-gate: 4 strokes + diagonal slash */
function FiveGate({
  size,
  shouldAnimate,
  animatingStrokes,
  baseIndex,
}: {
  size: "sm" | "md" | "lg";
  shouldAnimate: boolean;
  animatingStrokes: number[];
  baseIndex: number;
}) {
  const gapClass = { sm: "gap-[3px]", md: "gap-1", lg: "gap-1.5" }[size];

  return (
    <div className={`inline-flex items-end ${gapClass} relative`}>
      {Array.from({ length: 4 }).map((_, i) => {
        const strokeIndex = baseIndex + i + 1;
        const isAnimating =
          shouldAnimate && animatingStrokes.includes(strokeIndex);
        return <Stroke key={i} size={size} isAnimating={isAnimating} />;
      })}
      <div className="absolute inset-0 flex items-center justify-center">
        <Slash
          size={size}
          isAnimating={
            shouldAnimate && animatingStrokes.includes(baseIndex + 5)
          }
        />
      </div>
    </div>
  );
}

/** Display for counts >= 100 */
function LargeCountDisplay({
  count,
  size,
}: {
  count: number;
  size: "sm" | "md" | "lg";
}) {
  const blockSize = { sm: "w-3 h-3", md: "w-4 h-4", lg: "w-5 h-5" }[size];
  const gapClass = { sm: "gap-0.5", md: "gap-1", lg: "gap-1.5" }[size];

  if (count >= 10000) {
    // 10,000: 10×10 grid with diagonal closure
    return (
      <div className="relative">
        <div className={`grid grid-cols-10 ${gapClass}`}>
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className={`${blockSize} border border-current rounded-sm`}
            />
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-[2px] bg-accent rotate-45 scale-[1.4]" />
        </div>
      </div>
    );
  }

  if (count >= 1000) {
    // 1000-9999: rows of 10 squares
    const completeThousands = Math.floor(count / 1000);
    const remainder = count % 1000;
    const completeHundreds = Math.floor(remainder / 100);

    return (
      <div className={`flex flex-col ${gapClass}`}>
        {Array.from({ length: completeThousands }).map((_, rowIdx) => (
          <div key={rowIdx} className="relative">
            <div className={`flex ${gapClass}`}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`${blockSize} border border-current rounded-sm`}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-[2px] bg-current opacity-50" />
            </div>
          </div>
        ))}
        {remainder > 0 && (
          <div className={`flex ${gapClass}`}>
            {Array.from({ length: completeHundreds }).map((_, i) => (
              <HundredBlock key={i} size={size} complete />
            ))}
            {remainder % 100 > 0 && (
              <PartialHundred count={remainder % 100} size={size} />
            )}
          </div>
        )}
      </div>
    );
  }

  // 100-999: row of 100-blocks
  const completeHundreds = Math.floor(count / 100);
  const remainder = count % 100;

  return (
    <div className={`flex ${gapClass}`}>
      {Array.from({ length: completeHundreds }).map((_, i) => (
        <HundredBlock key={i} size={size} complete />
      ))}
      {remainder > 0 && <PartialHundred count={remainder} size={size} />}
    </div>
  );
}

/** 100-block: X + square outline */
function HundredBlock({
  size,
  complete,
}: {
  size: "sm" | "md" | "lg";
  complete?: boolean;
}) {
  const blockSize = { sm: "w-3 h-3", md: "w-4 h-4", lg: "w-5 h-5" }[size];

  return (
    <div className={`${blockSize} border border-tally-c3 rounded-sm relative`}>
      {complete && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-accent text-[8px] font-bold">×</span>
        </div>
      )}
    </div>
  );
}

/** Partial hundred (1-99 within a 100-block) */
function PartialHundred({
  count,
  size,
}: {
  count: number;
  size: "sm" | "md" | "lg";
}) {
  const complete25s = Math.floor(count / 25);
  const remainder = count % 25;
  const blockSize = { sm: "w-3 h-3", md: "w-4 h-4", lg: "w-5 h-5" }[size];

  return (
    <div className={`${blockSize} border border-border rounded-sm relative`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[6px] text-muted">{count}</span>
      </div>
    </div>
  );
}

export default TallyMark;
