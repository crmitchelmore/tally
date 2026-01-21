"use client";

import { memo } from "react";

export interface TallyDisplayProps {
  /** The count to display */
  count: number;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
  /** Color for strokes */
  color?: string;
}

/**
 * Tally Display Component
 *
 * Renders tally marks with the traditional counting pattern:
 * - 1-4: vertical strokes
 * - 5: 4 strokes + diagonal slash (5-gate)
 * - 25: X overlay (5×5)
 * - 100: Box outline (4×25)
 * - 1000: Horizontal line through 10 boxes
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

  // Break down count into components
  const thousands = Math.floor(count / 1000);
  const hundreds = Math.floor((count % 1000) / 100);
  const twentyFives = Math.floor((count % 100) / 25);
  const fives = Math.floor((count % 25) / 5);
  const ones = count % 5;

  return (
    <div 
      className={`inline-flex items-end flex-wrap ${className}`} 
      style={{ gap: sizes.gap * 2 }}
      role="img"
      aria-label={`${count} tallies`}
    >
      {/* Thousands: horizontal line through boxes */}
      {Array.from({ length: thousands }).map((_, i) => (
        <ThousandBlock key={`k-${i}`} sizes={sizes} color={color} />
      ))}
      
      {/* Hundreds: filled box with X */}
      {Array.from({ length: hundreds }).map((_, i) => (
        <HundredBox key={`h-${i}`} sizes={sizes} color={color} />
      ))}
      
      {/* Twenty-fives: X mark */}
      {Array.from({ length: twentyFives }).map((_, i) => (
        <TwentyFiveX key={`x-${i}`} sizes={sizes} color={color} />
      ))}
      
      {/* Fives: standard 5-gates */}
      {Array.from({ length: fives }).map((_, i) => (
        <FiveGate key={`f-${i}`} sizes={sizes} color={color} />
      ))}
      
      {/* Ones: vertical strokes */}
      {ones > 0 && (
        <div className="inline-flex items-end" style={{ gap: sizes.gap }}>
          {Array.from({ length: ones }).map((_, i) => (
            <Stroke key={`s-${i}`} sizes={sizes} color={color} />
          ))}
        </div>
      )}
    </div>
  );
});

/** Single vertical stroke */
function Stroke({ 
  sizes, 
  color,
  animating = false,
}: { 
  sizes: { stroke: number; height: number; gap: number; boxSize: number };
  color?: string;
  animating?: boolean;
}) {
  return (
    <span
      className={`rounded-full ${animating ? "animate-stroke-draw" : ""}`}
      style={{
        width: sizes.stroke,
        height: sizes.height,
        backgroundColor: color || "currentColor",
      }}
    />
  );
}

/** 5-gate: 4 strokes + diagonal slash */
function FiveGate({ 
  sizes, 
  color,
}: { 
  sizes: { stroke: number; height: number; gap: number; boxSize: number };
  color?: string;
}) {
  const gateWidth = sizes.stroke * 4 + sizes.gap * 3;
  
  return (
    <div 
      className="relative inline-flex items-end" 
      style={{ gap: sizes.gap, width: gateWidth }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <Stroke key={i} sizes={sizes} color={color} />
      ))}
      {/* Diagonal slash */}
      <span
        className="absolute rounded-full bg-accent"
        style={{
          width: sizes.stroke,
          height: sizes.height * 1.15,
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
  color?: string;
}) {
  const xSize = sizes.boxSize;
  const strokeColor = color || "currentColor";
  
  return (
    <div 
      className="relative" 
      style={{ width: xSize, height: xSize }}
    >
      {/* X lines */}
      <span
        className="absolute rounded-full"
        style={{
          width: sizes.stroke,
          height: xSize * 1.4,
          backgroundColor: strokeColor,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%) rotate(45deg)",
        }}
      />
      <span
        className="absolute rounded-full"
        style={{
          width: sizes.stroke,
          height: xSize * 1.4,
          backgroundColor: strokeColor,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%) rotate(-45deg)",
        }}
      />
    </div>
  );
}

/** 100-unit: Box outline with X inside */
function HundredBox({ 
  sizes, 
  color,
}: { 
  sizes: { stroke: number; height: number; gap: number; boxSize: number };
  color?: string;
}) {
  const boxSize = sizes.boxSize * 1.2;
  const strokeColor = color || "currentColor";
  
  return (
    <div 
      className="relative border-2 rounded-sm"
      style={{ 
        width: boxSize, 
        height: boxSize,
        borderColor: strokeColor,
      }}
    >
      {/* X inside */}
      <span
        className="absolute rounded-full bg-accent"
        style={{
          width: sizes.stroke - 1,
          height: boxSize * 0.9,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%) rotate(45deg)",
        }}
      />
      <span
        className="absolute rounded-full bg-accent"
        style={{
          width: sizes.stroke - 1,
          height: boxSize * 0.9,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%) rotate(-45deg)",
        }}
      />
    </div>
  );
}

/** 1000-unit: Row of boxes with horizontal line through */
function ThousandBlock({ 
  sizes, 
  color,
}: { 
  sizes: { stroke: number; height: number; gap: number; boxSize: number };
  color?: string;
}) {
  const boxSize = sizes.boxSize * 0.8;
  const rowWidth = boxSize * 5 + sizes.gap * 4;
  const strokeColor = color || "currentColor";
  
  return (
    <div className="relative">
      {/* Row of 5 mini boxes (representing 500, doubled with line = 1000) */}
      <div className="flex" style={{ gap: sizes.gap / 2 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="border rounded-sm"
            style={{
              width: boxSize,
              height: boxSize,
              borderColor: strokeColor,
              borderWidth: Math.max(1, sizes.stroke - 1),
            }}
          />
        ))}
      </div>
      {/* Horizontal line through */}
      <span
        className="absolute rounded-full"
        style={{
          width: rowWidth + sizes.gap * 2,
          height: sizes.stroke,
          backgroundColor: "var(--accent)",
          left: -sizes.gap,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />
    </div>
  );
}

export default TallyDisplay;
