"use client";

import { useMemo } from "react";
import type { Entry, Challenge } from "@/app/api/v1/_lib/types";

export interface BurnUpChartProps {
  entries: Entry[];
  challenge: Challenge;
  className?: string;
}

/**
 * Burn-up Chart - Shows cumulative progress toward a goal.
 * Displays:
 * - Target line (horizontal at goal)
 * - Actual progress line (cumulative daily totals)
 * - Projected completion based on current pace
 */
export function BurnUpChart({ entries, challenge, className = "" }: BurnUpChartProps) {
  const target = challenge.target;
  
  // Memoize date values to avoid dependency changes on every render
  const startDate = useMemo(() => new Date(challenge.startDate), [challenge.startDate]);
  const endDate = useMemo(() => new Date(challenge.endDate), [challenge.endDate]);
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Calculate cumulative data
  const cumulativeData = useMemo(() => {
    // Filter entries for this challenge and sort by date
    const challengeEntries = entries
      .filter(e => e.challengeId === challenge.id)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (challengeEntries.length === 0) return [];

    // Build cumulative sum
    let cumulative = 0;
    const data: Array<{ date: string; value: number }> = [];
    
    for (const entry of challengeEntries) {
      cumulative += entry.count;
      // Use last entry of each day for cumulative
      const existing = data.find(d => d.date === entry.date);
      if (existing) {
        existing.value = cumulative;
      } else {
        data.push({ date: entry.date, value: cumulative });
      }
    }

    return data;
  }, [entries, challenge.id]);

  // Calculate current pace and projection
  const projection = useMemo(() => {
    if (cumulativeData.length === 0) return null;

    const currentTotal = cumulativeData[cumulativeData.length - 1].value;
    const daysElapsed = Math.max(1, Math.ceil(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ));
    const dailyPace = currentTotal / daysElapsed;

    if (dailyPace <= 0) return null;

    const daysToComplete = Math.ceil((target - currentTotal) / dailyPace);
    const projectedEndDate = new Date(today);
    projectedEndDate.setDate(projectedEndDate.getDate() + daysToComplete);

    return {
      dailyPace,
      daysToComplete,
      projectedEndDate,
      currentTotal,
      percentComplete: Math.min(100, (currentTotal / target) * 100)
    };
  }, [cumulativeData, target, startDate, today]);

  if (cumulativeData.length === 0) {
    return (
      <div className={`bg-surface border border-border rounded-xl p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-ink mb-4">{challenge.name} Progress</h3>
        <p className="text-sm text-muted">Log entries to see your progress toward the goal.</p>
      </div>
    );
  }

  // SVG dimensions
  const width = 400;
  const height = 180;
  const padding = { top: 20, right: 10, bottom: 25, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // X-axis range: startDate to endDate (or projected end if later)
  const displayEndDate = projection?.projectedEndDate && projection.projectedEndDate > endDate
    ? projection.projectedEndDate
    : endDate;
  const totalDays = Math.ceil(
    (displayEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Y-axis range: 0 to max(target, current total)
  const yMax = Math.max(target, projection?.currentTotal || 0);

  // Helper to convert date to X coordinate
  const dateToX = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayOffset = Math.ceil((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return padding.left + (dayOffset / totalDays) * chartWidth;
  };

  // Helper to convert value to Y coordinate
  const valueToY = (value: number) => {
    return padding.top + chartHeight - (value / yMax) * chartHeight;
  };

  // Generate progress line path
  const progressPath = cumulativeData.map((d, i) => {
    const x = dateToX(d.date);
    const y = valueToY(d.value);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Target line Y position
  const targetY = valueToY(target);

  // End date X position
  const endX = dateToX(challenge.endDate);

  // Projection line (from current to target)
  const projectionPath = projection && projection.currentTotal < target
    ? `M ${dateToX(cumulativeData[cumulativeData.length - 1].date)} ${valueToY(projection.currentTotal)} L ${dateToX(projection.projectedEndDate.toISOString().split('T')[0])} ${targetY}`
    : null;

  // Y-axis labels
  const yLabels = [0, Math.round(yMax / 2), yMax];

  const paceStatus = projection
    ? projection.projectedEndDate <= endDate ? "ahead" : "behind"
    : "unknown";

  return (
    <div className={`bg-surface border border-border rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-ink">{challenge.name} Progress</h3>
        {projection && (
          <span className={`text-sm font-medium ${paceStatus === "ahead" ? "text-success" : "text-warning"}`}>
            {projection.percentComplete.toFixed(0)}% complete
          </span>
        )}
      </div>

      {/* SVG Chart */}
      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44">
          {/* Grid lines */}
          {yLabels.map((val, i) => {
            const y = valueToY(val);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeDasharray="2,2"
                />
                <text
                  x={padding.left - 5}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-muted text-[10px]"
                >
                  {val.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Target line */}
          <line
            x1={padding.left}
            y1={targetY}
            x2={width - padding.right}
            y2={targetY}
            stroke="var(--color-accent)"
            strokeWidth={2}
            strokeDasharray="6,3"
          />
          <text
            x={width - padding.right + 5}
            y={targetY + 4}
            className="fill-accent text-[10px] font-medium"
          >
            Goal
          </text>

          {/* End date vertical line */}
          <line
            x1={endX}
            y1={padding.top}
            x2={endX}
            y2={padding.top + chartHeight}
            stroke="var(--color-muted)"
            strokeWidth={1}
            strokeDasharray="4,4"
          />

          {/* Projection line (dashed) */}
          {projectionPath && (
            <path
              d={projectionPath}
              fill="none"
              stroke="var(--color-muted)"
              strokeWidth={1.5}
              strokeDasharray="4,4"
            />
          )}

          {/* Progress line */}
          <path
            d={progressPath}
            fill="none"
            stroke="var(--color-success)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current point */}
          {cumulativeData.length > 0 && (
            <circle
              cx={dateToX(cumulativeData[cumulativeData.length - 1].date)}
              cy={valueToY(cumulativeData[cumulativeData.length - 1].value)}
              r={5}
              fill="var(--color-success)"
            />
          )}

          {/* X-axis labels */}
          <text
            x={padding.left}
            y={height - 5}
            className="fill-muted text-[10px]"
          >
            {formatDateShort(challenge.startDate)}
          </text>
          <text
            x={endX}
            y={height - 5}
            textAnchor="middle"
            className="fill-muted text-[10px]"
          >
            {formatDateShort(challenge.endDate)}
          </text>
        </svg>
      </div>

      {/* Pace info */}
      {projection && (
        <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-muted">Daily pace:</span>{" "}
            <span className="font-medium text-ink">{projection.dailyPace.toFixed(1)}/day</span>
          </div>
          <div>
            <span className="text-muted">Current:</span>{" "}
            <span className="font-medium text-ink">{projection.currentTotal.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted">Remaining:</span>{" "}
            <span className="font-medium text-ink">{Math.max(0, target - projection.currentTotal).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default BurnUpChart;
