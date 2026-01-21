"use client";

import { memo } from "react";

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
      className={`inline-flex flex-col items-start ${className}`} 
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

/** Single vertical stroke */
function Stroke({ 
  sizes, 
  color,
}: { 
  sizes: { stroke: number; height: number; gap: number; boxSize: number };
  color: string;
}) {
  return (
    <span
      className="rounded-full"
      style={{
        width: sizes.stroke,
        height: sizes.height,
        backgroundColor: color,
      }}
    />
  );
}

/** 5-gate: 4 strokes + diagonal slash */
function FiveGate({ 
  sizes, 
  c1,
  c2,
}: { 
  sizes: { stroke: number; height: number; gap: number; boxSize: number };
  c1: string;
  c2: string;
}) {
  const gateWidth = sizes.stroke * 4 + sizes.gap * 3;
  
  return (
    <div 
      className="relative inline-flex items-end" 
      style={{ gap: sizes.gap, width: gateWidth }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <Stroke key={i} sizes={sizes} color={c1} />
      ))}
      {/* Diagonal slash in accent color (C2) */}
      <span
        className="absolute rounded-full"
        style={{
          width: sizes.stroke,
          height: sizes.height * 1.15,
          backgroundColor: c2,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%) rotate(-18deg)",
        }}
      />
    </div>
  );
}

/** 25-unit: X mark */
function TwentyFiveX({ 
  sizes, 
  color,
}: { 
  sizes: { stroke: number; height: number; gap: number; boxSize: number };
  color: string;
}) {
  const xSize = sizes.boxSize * 1.1;
  
  return (
    <div 
      className="relative" 
      style={{ width: xSize, height: xSize }}
    >
      <span
        className="absolute rounded-full"
        style={{
          width: sizes.stroke,
          height: xSize * 1.3,
          backgroundColor: color,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%) rotate(45deg)",
        }}
      />
      <span
        className="absolute rounded-full"
        style={{
          width: sizes.stroke,
          height: xSize * 1.3,
          backgroundColor: color,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%) rotate(-45deg)",
        }}
      />
    </div>
  );
}

/** Xs displayed in 2x2 grid positions (for 26-99 range) */
function XsInGridLayout({
  sizes,
  count,
  c2,
}: {
  sizes: { stroke: number; height: number; gap: number; boxSize: number };
  count: number; // 1-3 Xs
  c2: string;
}) {
  // Box size matches HundredBox for visual consistency
  const boxSize = sizes.boxSize * 2.4;
  const xSize = sizes.boxSize * 0.9;
  const xStroke = Math.max(1, sizes.stroke - 1);
  
  // Fill order: bottom-left, top-left, bottom-right (then top-right for 4th)
  const fillOrder = [
    { x: "25%", y: "75%" },  // bottom-left (1st)
    { x: "25%", y: "25%" },  // top-left (2nd)
    { x: "75%", y: "75%" },  // bottom-right (3rd)
    { x: "75%", y: "25%" },  // top-right (4th - only when complete)
  ];
  
  return (
    <div 
      className="relative" 
      style={{ width: boxSize, height: boxSize }}
    >
      {fillOrder.slice(0, count).map((pos, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: pos.x,
            top: pos.y,
            transform: "translate(-50%, -50%)",
            width: xSize,
            height: xSize,
          }}
        >
          <span
            className="absolute rounded-full"
            style={{
              width: xStroke,
              height: xSize * 1.2,
              backgroundColor: c2,
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%) rotate(45deg)",
            }}
          />
          <span
            className="absolute rounded-full"
            style={{
              width: xStroke,
              height: xSize * 1.2,
              backgroundColor: c2,
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%) rotate(-45deg)",
            }}
          />
        </div>
      ))}
    </div>
  );
}

/** 100-unit: Box outline with 4 X marks inside */
function HundredBox({ 
  sizes, 
  c2,
  c3,
}: { 
  sizes: { stroke: number; height: number; gap: number; boxSize: number };
  c2: string;
  c3: string;
}) {
  const boxSize = sizes.boxSize * 2.4;
  const xSize = sizes.boxSize * 0.9;
  const xStroke = Math.max(1, sizes.stroke - 1);
  
  // All 4 positions filled
  const positions = [
    { x: "25%", y: "25%" }, // top-left
    { x: "75%", y: "25%" }, // top-right
    { x: "25%", y: "75%" }, // bottom-left
    { x: "75%", y: "75%" }, // bottom-right
  ];
  
  return (
    <div 
      className="relative border-2 rounded-sm"
      style={{ 
        width: boxSize, 
        height: boxSize,
        borderColor: c3, // Box outline in muted color (C3)
      }}
    >
      {/* 4 X marks inside in accent color (C2) */}
      {positions.map((pos, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: pos.x,
            top: pos.y,
            transform: "translate(-50%, -50%)",
            width: xSize,
            height: xSize,
          }}
        >
          <span
            className="absolute rounded-full"
            style={{
              width: xStroke,
              height: xSize * 1.2,
              backgroundColor: c2, // X in accent color
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%) rotate(45deg)",
            }}
          />
          <span
            className="absolute rounded-full"
            style={{
              width: xStroke,
              height: xSize * 1.2,
              backgroundColor: c2, // X in accent color
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%) rotate(-45deg)",
            }}
          />
        </div>
      ))}
    </div>
  );
}

/** 1000-unit: Row of 10 boxes with horizontal line through */
function ThousandBlock({ 
  sizes, 
  c1,
  c3,
}: { 
  sizes: { stroke: number; height: number; gap: number; boxSize: number };
  c1: string;
  c3: string;
}) {
  const boxSize = sizes.boxSize * 0.6;
  const rowWidth = boxSize * 10 + sizes.gap * 9;
  
  return (
    <div className="relative">
      {/* Row of 10 mini boxes in C3 */}
      <div className="flex" style={{ gap: sizes.gap / 2 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="border rounded-sm"
            style={{
              width: boxSize,
              height: boxSize,
              borderColor: c3,
              borderWidth: Math.max(1, sizes.stroke - 1),
            }}
          />
        ))}
      </div>
      {/* Horizontal line through in accent color */}
      <span
        className="absolute rounded-full"
        style={{
          width: rowWidth + sizes.gap * 2,
          height: sizes.stroke,
          backgroundColor: "var(--color-accent)",
          left: -sizes.gap,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />
    </div>
  );
}

export default TallyDisplay;
