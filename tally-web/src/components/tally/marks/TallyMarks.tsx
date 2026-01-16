"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface TallyMarksProps {
  count: number;
  size?: "sm" | "md" | "lg" | "xl";
  color?: string;
  animate?: boolean;
  maxDisplay?: number;
  className?: string;
}

/**
 * Renders authentic tally marks - the core visual identity of Tally.
 * Groups of 5: four vertical strokes with a diagonal strike-through.
 */
export function TallyMarks({
  count,
  size = "md",
  color = "currentColor",
  animate = false,
  maxDisplay = 50,
  className = "",
}: TallyMarksProps) {
  const displayCount = Math.min(count, maxDisplay);
  const groups = Math.floor(displayCount / 5);
  const remainder = displayCount % 5;

  const sizeConfig = {
    sm: { height: 20, strokeWidth: 1.5, gap: 3, groupGap: 12 },
    md: { height: 32, strokeWidth: 2, gap: 4, groupGap: 16 },
    lg: { height: 48, strokeWidth: 2.5, gap: 5, groupGap: 20 },
    xl: { height: 64, strokeWidth: 3, gap: 6, groupGap: 24 },
  };

  const config = sizeConfig[size];
  const markWidth = config.gap * 4 + config.strokeWidth;

  // Calculate total width
  const totalGroups = groups + (remainder > 0 ? 1 : 0);
  const totalWidth = totalGroups * markWidth + (totalGroups - 1) * config.groupGap;

  return (
    <div className={`inline-flex items-center ${className}`}>
      <svg
        width={Math.max(totalWidth, 20)}
        height={config.height}
        viewBox={`0 0 ${Math.max(totalWidth, 20)} ${config.height}`}
        fill="none"
        className="overflow-visible"
      >
        {/* Complete groups of 5 */}
        {Array.from({ length: groups }).map((_, groupIndex) => (
          <TallyGroup
            key={`group-${groupIndex}`}
            x={groupIndex * (markWidth + config.groupGap)}
            height={config.height}
            strokeWidth={config.strokeWidth}
            gap={config.gap}
            color={color}
            count={5}
            animate={animate}
            delay={groupIndex * 0.1}
          />
        ))}

        {/* Remainder marks */}
        {remainder > 0 && (
          <TallyGroup
            x={groups * (markWidth + config.groupGap)}
            height={config.height}
            strokeWidth={config.strokeWidth}
            gap={config.gap}
            color={color}
            count={remainder}
            animate={animate}
            delay={groups * 0.1}
          />
        )}
      </svg>
      
      {count > maxDisplay && (
        <span 
          className="ml-2 text-sm font-medium opacity-60"
          style={{ color }}
        >
          +{count - maxDisplay}
        </span>
      )}
    </div>
  );
}

interface TallyGroupProps {
  x: number;
  height: number;
  strokeWidth: number;
  gap: number;
  color: string;
  count: number;
  animate: boolean;
  delay: number;
}

function TallyGroup({ x, height, strokeWidth, gap, color, count, animate, delay }: TallyGroupProps) {
  // Add slight randomness to make marks feel hand-drawn
  const randomOffset = useMemo(() => {
    return Array.from({ length: 4 }).map(() => ({
      x: (Math.random() - 0.5) * 1.5,
      y1: (Math.random() - 0.5) * 2,
      y2: (Math.random() - 0.5) * 2,
    }));
  }, []);

  const verticalMarks = Math.min(count, 4);
  const hasStrike = count === 5;

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: delay + i * 0.05, duration: 0.15, ease: [0.33, 1, 0.68, 1] as const },
        opacity: { delay: delay + i * 0.05, duration: 0.01 },
      },
    }),
  };

  return (
    <g>
      {/* Vertical marks */}
      {Array.from({ length: verticalMarks }).map((_, i) => {
        const markX = x + i * gap + randomOffset[i].x;
        const y1 = 2 + randomOffset[i].y1;
        const y2 = height - 2 + randomOffset[i].y2;

        return animate ? (
          <motion.line
            key={`mark-${i}`}
            x1={markX}
            y1={y1}
            x2={markX}
            y2={y2}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            custom={i}
            variants={pathVariants}
            initial="hidden"
            animate="visible"
          />
        ) : (
          <line
            key={`mark-${i}`}
            x1={markX}
            y1={y1}
            x2={markX}
            y2={y2}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        );
      })}

      {/* Diagonal strike-through for groups of 5 */}
      {hasStrike && (
        animate ? (
          <motion.line
            x1={x - gap / 2}
            y1={height - 4}
            x2={x + 3 * gap + gap / 2}
            y2={4}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            custom={4}
            variants={pathVariants}
            initial="hidden"
            animate="visible"
          />
        ) : (
          <line
            x1={x - gap / 2}
            y1={height - 4}
            x2={x + 3 * gap + gap / 2}
            y2={4}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )
      )}
    </g>
  );
}

/**
 * Interactive tally marks for adding entries - tap to add marks
 */
interface TallyInputProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  color?: string;
  className?: string;
}

export function TallyInput({ 
  value, 
  onChange, 
  max = 25,
  color = "var(--ink)",
  className = "" 
}: TallyInputProps) {
  const handleTap = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleRemove = () => {
    if (value > 0) {
      onChange(value - 1);
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Tally display area - tap to add */}
      <button
        type="button"
        onClick={handleTap}
        className="min-h-[80px] min-w-[200px] p-6 rounded-xl border-2 border-dashed border-gray-200 
                   hover:border-gray-400 hover:bg-gray-50/50 transition-all duration-150
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400
                   active:scale-[0.98] cursor-pointer"
        disabled={value >= max}
      >
        {value === 0 ? (
          <span className="text-gray-400 text-sm">Tap to add a mark</span>
        ) : (
          <TallyMarks count={value} size="lg" color={color} animate />
        )}
      </button>

      {/* Count and controls */}
      <div className="flex items-center gap-4 mt-4">
        <button
          type="button"
          onClick={handleRemove}
          disabled={value === 0}
          className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center
                     text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed
                     transition-colors"
        >
          −
        </button>
        <span className="text-3xl font-light tabular-nums min-w-[3ch] text-center">{value}</span>
        <button
          type="button"
          onClick={handleTap}
          disabled={value >= max}
          className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center
                     text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed
                     transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

/**
 * Compact tally mark display for showing progress inline
 */
export function TallyProgress({ 
  current, 
  target, 
  color = "var(--ink)",
  showNumbers = true,
  className = "" 
}: { 
  current: number; 
  target: number;
  color?: string;
  showNumbers?: boolean;
  className?: string;
}) {
  const percentage = Math.min(100, (current / target) * 100);
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 min-w-0">
        <TallyMarks count={Math.min(current, 25)} size="sm" color={color} maxDisplay={25} />
      </div>
      {showNumbers && (
        <span className="text-sm font-medium whitespace-nowrap">
          <span style={{ color }}>{current}</span>
          <span className="text-gray-400">/{target}</span>
        </span>
      )}
    </div>
  );
}
