"use client";

import { memo, useId } from "react";
import { useTallyFeedback } from "@/hooks/use-tally-feedback";

export interface TallyDisplayProps {
  /** The count to display */
  count: number;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
  /** Base color for strokes (C1) */
  color?: string;
}

/**
 * Tally Display Component
 *
 * Renders tally marks with the traditional counting pattern and color hierarchy:
 * - C1 (ink): Base strokes, 5-gate verticals
 * - C2 (accent): 5th stroke diagonal slash, X marks for 25
 * - C3 (muted): Box outline for 100
 * - Accent: Horizontal line for 1000
 *
 * Pattern:
 * - 1-4: vertical strokes
 * - 5: 4 strokes + diagonal slash (5-gate)
 * - 25: X mark (in C2 color)
 * - 26-99: Xs in 2x2 grid positions (bottom-left, top-left, bottom-right, top-right)
 * - 100: Box outline (C3) containing 4 Xs (C2)
 * - 1000: Row of boxes with horizontal line through (accent)
 */
export const TallyDisplay = memo(function TallyDisplay({
  count,
  size = "md",
  className = "",
  color,
}: TallyDisplayProps) {
  const feedbackRef = useTallyFeedback<HTMLDivElement>(count);
  const sizes = {
    sm: { stroke: 2, height: 16, gap: 3, boxSize: 12 },
    md: { stroke: 3, height: 28, gap: 4, boxSize: 16 },
    lg: { stroke: 4, height: 40, gap: 6, boxSize: 20 },
  }[size];

  // Color hierarchy
  const c1 = color || "currentColor"; // Base strokes
  const c2 = "var(--color-accent)"; // X marks (25s)
  const c3 = "var(--color-muted)"; // Box outlines (100s)

  // Break down count into components
  const thousands = Math.floor(count / 1000);
  const hundreds = Math.floor((count % 1000) / 100);
  const twentyFives = Math.floor((count % 100) / 25);
  const fives = Math.floor((count % 25) / 5);
  const ones = count % 5;

  // For 26-99, show Xs in grid positions as if filling a 100-box
  const showXsInGrid = twentyFives > 0 && twentyFives < 4;

  // Has remainder after thousands
  const hasRemainder = hundreds > 0 || twentyFives > 0 || fives > 0 || ones > 0;

  return (
    <div
      ref={feedbackRef}
      className={`tally-display inline-flex flex-col items-start ${className}`}
      style={{ gap: sizes.gap }}
      role="img"
      aria-label={`${count} tallies`}
    >
      {/* Thousands: each 1000 is a row of 10 boxes with line through, stacked vertically */}
      {Array.from({ length: thousands }).map((_, i) => (
        <ThousandBlock key={`k-${i}`} sizes={sizes} c1={c1} c3={c3} />
      ))}

      {/* Remainder row: hundreds, 25s, 5s, 1s */}
      {hasRemainder && (
        <div
          className="inline-flex items-end flex-wrap"
          style={{ gap: sizes.gap * 2 }}
        >
          {/* Hundreds: box with 4 Xs */}
          {Array.from({ length: hundreds }).map((_, i) => (
            <HundredBox key={`h-${i}`} sizes={sizes} c2={c2} c3={c3} />
          ))}

          {/* Twenty-fives: X marks in grid layout (like filling a box) */}
          {showXsInGrid ? (
            <XsInGridLayout sizes={sizes} count={twentyFives} c2={c2} />
          ) : (
            // Full 4 Xs shown as individual marks
            Array.from({ length: twentyFives }).map((_, i) => (
              <TwentyFiveX key={`x-${i}`} sizes={sizes} color={c2} />
            ))
          )}

          {/* Fives: standard 5-gates */}
          {Array.from({ length: fives }).map((_, i) => (
            <FiveGate key={`f-${i}`} sizes={sizes} c1={c1} c2={c2} />
          ))}

          {/* Ones: vertical strokes */}
          {ones > 0 && (
            <div className="inline-flex items-end" style={{ gap: sizes.gap }}>
              {Array.from({ length: ones }).map((_, i) => (
                <Stroke key={`s-${i}`} sizes={sizes} color={c1} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

type Sizes = { stroke: number; height: number; gap: number; boxSize: number };
type Segment = [number, number, number, number];

/** A seed belongs to the mounted drawing, never the count or an animation frame.
 * useId keeps server rendering and hydration identical without global randomness.
 */
export function InkGlyph({ width, height, stroke, color, segments, className = "" }: {
  width: number; height: number; stroke: number; color: string;
  segments: Segment[]; className?: string;
}) {
  const id = useId();
  const seed = Array.from(id).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) | 0, 0);
  const noise = (index: number) => {
    // Integer mixing is identical in server and browser JS engines.
    let value = (seed + Math.imul(index + 1, 0x9e3779b9)) | 0;
    value = Math.imul(value ^ (value >>> 16), 0x21f0aaad);
    value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
    return ((value ^ (value >>> 15)) >>> 0) / 0xffffffff * 2 - 1;
  };
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
    className={`overflow-visible shrink-0 ${className}`} aria-hidden="true" fill="none">
    {segments.map(([x1, y1, x2, y2], i) => {
      const n = i * 7;
      const dx = x2 - x1, dy = y2 - y1;
      const length = Math.hypot(dx, dy) || 1;
      const bend = Math.min(length * 0.035, stroke * 0.8) * noise(n + 1);
      const j = stroke * 0.3;
      const d = `M ${x1 + noise(n + 2) * j} ${y1 + noise(n + 3) * j} Q ${(x1 + x2) / 2 - dy / length * bend} ${(y1 + y2) / 2 + dx / length * bend} ${x2 + noise(n + 4) * j} ${y2 + noise(n + 5) * j}`;
      return <path key={i} d={d} stroke={color} strokeWidth={stroke * (1 + noise(n + 6) * 0.1)} strokeLinecap="round" strokeLinejoin="round" />;
    })}
  </svg>;
}

function Stroke({ sizes, color }: { sizes: Sizes; color: string }) {
  return <InkGlyph width={sizes.stroke} height={sizes.height} stroke={sizes.stroke} color={color}
    segments={[[sizes.stroke / 2, sizes.stroke / 2, sizes.stroke / 2, sizes.height - sizes.stroke / 2]]} />;
}

function FiveGate({ sizes, c1, c2 }: { sizes: Sizes; c1: string; c2: string }) {
  const width = sizes.stroke * 4 + sizes.gap * 3;
  return <div className="relative inline-flex items-end" style={{ gap: sizes.gap, width }}>
    {Array.from({ length: 4 }, (_, i) => <Stroke key={i} sizes={sizes} color={c1} />)}
    <InkGlyph className="absolute inset-0" width={width} height={sizes.height} stroke={sizes.stroke} color={c2}
      segments={[[0, sizes.height * 0.78, width, sizes.height * 0.22]]} />
  </div>;
}

function TwentyFiveX({ sizes, color }: { sizes: Sizes; color: string }) {
  const side = sizes.boxSize * 0.9;
  return <InkGlyph width={side} height={side} stroke={Math.max(1, sizes.stroke - 1)} color={color}
    segments={[[1, 1, side - 1, side - 1], [side - 1, 1, 1, side - 1]]} />;
}

function XsInGridLayout({ sizes, count, c2 }: { sizes: Sizes; count: number; c2: string }) {
  const side = sizes.boxSize * 2.4;
  return <div className="relative" style={{ width: side, height: side }}>
    {[[25, 75], [25, 25], [75, 75], [75, 25]].slice(0, count).map(([x, y], i) =>
      <div key={i} className="absolute" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}>
        <TwentyFiveX sizes={sizes} color={c2} />
      </div>)}
  </div>;
}

function InkBox({ side, stroke, color }: { side: number; stroke: number; color: string }) {
  const inset = stroke / 2;
  const end = side - inset;
  return <InkGlyph width={side} height={side} stroke={stroke} color={color}
    segments={[[inset, inset, end, inset], [end, inset, end, end], [end, end, inset, end], [inset, end, inset, inset]]} />;
}

function HundredBox({ sizes, c2, c3 }: { sizes: Sizes; c2: string; c3: string }) {
  const side = sizes.boxSize * 2.4;
  return <div className="relative">
    <InkBox side={side} stroke={2} color={c3} />
    <div className="absolute inset-0"><XsInGridLayout sizes={sizes} count={4} c2={c2} /></div>
  </div>;
}

function ThousandBlock({ sizes, c3 }: { sizes: Sizes; c1: string; c3: string }) {
  const side = sizes.boxSize * 0.6;
  const gap = sizes.gap / 2;
  const width = side * 10 + gap * 9;
  return <div className="relative">
    <div className="flex" style={{ gap }}>
      {Array.from({ length: 10 }, (_, i) => <InkBox key={i} side={side} stroke={Math.max(1, sizes.stroke - 1)} color={c3} />)}
    </div>
    <InkGlyph className="absolute inset-0" width={width} height={side} stroke={sizes.stroke}
      color="var(--color-accent)" segments={[[0, side / 2, width, side / 2]]} />
  </div>;
}

export default TallyDisplay;
