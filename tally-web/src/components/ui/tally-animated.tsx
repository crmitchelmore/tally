"use client";

import { memo, useState, useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

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

interface AnimatingStroke {
  id: number;
  type: "stroke" | "slash" | "x" | "box" | "line";
}

/**
 * Animated Tally Display
 * 
 * Shows tally marks with ink-stroke animation when count increases.
 * Used in add entry dialogs to provide satisfying visual feedback.
 */
export const TallyAnimated = memo(function TallyAnimated({
  count,
  maxCount,
  size = "md",
  color,
  className = "",
}: TallyAnimatedProps) {
  const prefersReducedMotion = useReducedMotion();
  const prevCountRef = useRef(count);
  const [animatingStrokes, setAnimatingStrokes] = useState<AnimatingStroke[]>([]);
  
  const sizes = {
    sm: { stroke: 2, height: 20, gap: 4, boxSize: 14 },
    md: { stroke: 3, height: 32, gap: 5, boxSize: 18 },
    lg: { stroke: 4, height: 44, gap: 6, boxSize: 24 },
  }[size];

  // Animate new strokes when count increases
  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const prev = prevCountRef.current;
    const diff = count - prev;
    prevCountRef.current = count;
    
    if (diff > 0) {
      // Determine what type of stroke to animate
      const newStrokes: AnimatingStroke[] = [];
      for (let i = prev + 1; i <= count; i++) {
        if (i % 1000 === 0) {
          newStrokes.push({ id: i, type: "line" });
        } else if (i % 100 === 0) {
          newStrokes.push({ id: i, type: "box" });
        } else if (i % 25 === 0) {
          newStrokes.push({ id: i, type: "x" });
        } else if (i % 5 === 0) {
          newStrokes.push({ id: i, type: "slash" });
        } else {
          newStrokes.push({ id: i, type: "stroke" });
        }
      }
      
      setAnimatingStrokes(newStrokes);
      const timer = setTimeout(() => setAnimatingStrokes([]), 400);
      return () => clearTimeout(timer);
    }
  }, [count, prefersReducedMotion]);

  // Break down count into components
  const thousands = Math.floor(count / 1000);
  const hundreds = Math.floor((count % 1000) / 100);
  const twentyFives = Math.floor((count % 100) / 25);
  const fives = Math.floor((count % 25) / 5);
  const ones = count % 5;
  
  const strokeColor = color || "currentColor";
  const hasAnimation = animatingStrokes.length > 0;
  
  // Has remainder after thousands
  const hasRemainder = hundreds > 0 || twentyFives > 0 || fives > 0 || ones > 0;

  return (
    <div 
      className={`relative ${className}`}
      role="img"
      aria-label={`${count} tallies${maxCount ? ` of ${maxCount}` : ""}`}
    >
      {/* Tally marks container - column layout for thousands */}
      <div 
        className="inline-flex flex-col items-start" 
        style={{ gap: sizes.gap }}
      >
        {/* Thousands: each 1000 is a row of 10 boxes with line through */}
        {Array.from({ length: thousands }).map((_, i) => (
          <ThousandBlock 
            key={`k-${i}`} 
            sizes={sizes} 
            color={strokeColor}
            animating={hasAnimation && animatingStrokes.some(s => s.type === "line")}
          />
        ))}
        
        {/* Remainder row */}
        {(hasRemainder || count === 0) && (
          <div 
            className="inline-flex items-end flex-wrap" 
            style={{ gap: sizes.gap * 3 }}
          >
            {/* Hundreds: filled box with 4 Xs */}
            {Array.from({ length: hundreds }).map((_, i) => (
              <HundredBox 
                key={`h-${i}`} 
                sizes={sizes} 
                color={strokeColor}
                animating={hasAnimation && i === hundreds - 1 && animatingStrokes.some(s => s.type === "box")}
              />
            ))}
            
            {/* Twenty-fives: X mark */}
            {Array.from({ length: twentyFives }).map((_, i) => (
              <TwentyFiveX 
                key={`x-${i}`} 
                sizes={sizes} 
                color={strokeColor}
                animating={hasAnimation && i === twentyFives - 1 && animatingStrokes.some(s => s.type === "x")}
              />
            ))}
            
            {/* Fives: standard 5-gates with visual gap between each */}
            {fives > 0 && (
              <div className="inline-flex items-end" style={{ gap: sizes.gap * 2.5 }}>
                {Array.from({ length: fives }).map((_, i) => (
                  <FiveGate 
                    key={`f-${i}`} 
                    sizes={sizes} 
                    color={strokeColor}
                    slashAnimating={hasAnimation && i === fives - 1 && animatingStrokes.some(s => s.type === "slash")}
                  />
                ))}
              </div>
            )}
            
            {/* Ones: vertical strokes */}
            {ones > 0 && (
              <div className="inline-flex items-end" style={{ gap: sizes.gap }}>
                {Array.from({ length: ones }).map((_, i) => (
                  <Stroke 
                    key={`s-${i}`} 
                    sizes={sizes} 
                    color={strokeColor}
                    animating={hasAnimation && i === ones - 1 && animatingStrokes.some(s => s.type === "stroke")}
                  />
                ))}
              </div>
            )}
            
            {/* Placeholder when count is 0 */}
            {count === 0 && (
              <span className="text-muted text-sm">Add your first tally</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

/** Single vertical stroke with animation */
function Stroke({ 
  sizes, 
  color,
  animating = false,
}: { 
  sizes: { stroke: number; height: number; gap: number; boxSize: number };
  color: string;
  animating?: boolean;
}) {
  return (
    <span
      className={`rounded-full transition-transform ${animating ? "animate-stroke-draw scale-y-0" : "scale-y-100"}`}
      style={{
        width: sizes.stroke,
        height: sizes.height,
        backgroundColor: color,
        transformOrigin: "bottom",
        animation: animating ? "stroke-draw 0.3s ease-out forwards" : undefined,
      }}
    />
  );
}

/** 5-gate: 4 strokes + diagonal slash (accent) */
function FiveGate({ 
  sizes, 
  color,
  slashAnimating = false,
}: { 
  sizes: { stroke: number; height: number; gap: number; boxSize: number };
  color: string;
  slashAnimating?: boolean;
}) {
  const gateWidth = sizes.stroke * 4 + sizes.gap * 3;
  const accentColor = "var(--color-accent)";
  
  return (
    <div 
      className="relative inline-flex items-end" 
      style={{ gap: sizes.gap, width: gateWidth }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <Stroke key={i} sizes={sizes} color={color} />
      ))}
      {/* Diagonal slash in accent color */}
      <span
        className={`absolute rounded-full ${slashAnimating ? "animate-slash-draw" : ""}`}
        style={{
          width: sizes.stroke,
          height: sizes.height * 1.15,
          backgroundColor: accentColor,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%) rotate(-65deg)",
          transformOrigin: "center",
          animation: slashAnimating ? "slash-draw 0.3s ease-out forwards" : undefined,
        }}
      />
    </div>
  );
}

/** 25-unit: X mark - uses accent color */
function TwentyFiveX({ 
  sizes, 
  color,
  animating = false,
}: { 
  sizes: { stroke: number; height: number; gap: number; boxSize: number };
  color: string;
  animating?: boolean;
}) {
  const xSize = sizes.boxSize;
  const accentColor = "var(--color-accent)";
  
  return (
    <div 
      className={`relative ${animating ? "animate-x-draw" : ""}`}
      style={{ 
        width: xSize, 
        height: xSize,
        animation: animating ? "x-draw 0.3s ease-out forwards" : undefined,
      }}
    >
      <span
        className="absolute rounded-full"
        style={{
          width: sizes.stroke,
          height: xSize * 1.4,
          backgroundColor: accentColor,
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
          backgroundColor: accentColor,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%) rotate(-45deg)",
        }}
      />
    </div>
  );
}

/** 100-unit: Box outline (muted) with 4 Xs inside (accent) */
function HundredBox({ 
  sizes, 
  color,
  animating = false,
}: { 
  sizes: { stroke: number; height: number; gap: number; boxSize: number };
  color: string;
  animating?: boolean;
}) {
  const boxSize = sizes.boxSize * 2;
  const xSize = sizes.boxSize * 0.7;
  const xStroke = Math.max(1, sizes.stroke - 1);
  const mutedColor = "var(--color-muted)";
  const accentColor = "var(--color-accent)";
  
  // 4 X positions in 2x2 grid
  const positions = [
    { x: "25%", y: "25%" }, // top-left
    { x: "75%", y: "25%" }, // top-right
    { x: "25%", y: "75%" }, // bottom-left
    { x: "75%", y: "75%" }, // bottom-right
  ];
  
  return (
    <div 
      className={`relative border-2 rounded-sm ${animating ? "animate-box-draw" : ""}`}
      style={{ 
        width: boxSize, 
        height: boxSize,
        borderColor: mutedColor,
        animation: animating ? "box-draw 0.3s ease-out forwards" : undefined,
      }}
    >
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
              backgroundColor: accentColor,
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
              backgroundColor: accentColor,
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

/** 1000-unit: Row of 10 boxes (muted) with horizontal line through (accent) */
function ThousandBlock({ 
  sizes, 
  color,
  animating = false,
}: { 
  sizes: { stroke: number; height: number; gap: number; boxSize: number };
  color: string;
  animating?: boolean;
}) {
  const boxSize = sizes.boxSize * 0.6;
  const rowWidth = boxSize * 10 + sizes.gap * 9;
  const mutedColor = "var(--color-muted)";
  const accentColor = "var(--color-accent)";
  
  return (
    <div className={`relative ${animating ? "animate-line-draw" : ""}`}>
      <div className="flex" style={{ gap: sizes.gap / 2 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="border rounded-sm"
            style={{
              width: boxSize,
              height: boxSize,
              borderColor: mutedColor,
              borderWidth: Math.max(1, sizes.stroke - 1),
            }}
          />
        ))}
      </div>
      <span
        className="absolute rounded-full"
        style={{
          width: rowWidth + sizes.gap * 2,
          height: sizes.stroke,
          backgroundColor: accentColor,
          left: -sizes.gap,
          top: "50%",
          transform: "translateY(-50%)",
          animation: animating ? "line-draw 0.3s ease-out forwards" : undefined,
        }}
      />
    </div>
  );
}

export default TallyAnimated;
