"use client";

import { useMemo, useState } from "react";
import type { Entry, Challenge } from "@/app/api/v1/_lib/types";

export interface ProgressGraphProps {
  entries: Entry[];
  challenges: Map<string, Challenge>;
  className?: string;
}

interface DayData {
  date: string;
  total: number;
  byChallenge: Record<string, number>;
}

/**
 * Progress Graph - SVG line chart showing daily totals over time.
 * Supports filtering by challenge with toggleable legend.
 */
export function ProgressGraph({ entries, challenges, className = "" }: ProgressGraphProps) {
  const [visibleChallenges, setVisibleChallenges] = useState<Set<string>>(() => 
    new Set(Array.from(challenges.keys()))
  );

  // Aggregate entries by date
  const dailyData = useMemo(() => {
    const dataMap = new Map<string, DayData>();
    
    for (const entry of entries) {
      const existing = dataMap.get(entry.date) || { 
        date: entry.date, 
        total: 0, 
        byChallenge: {} 
      };
      existing.total += entry.count;
      existing.byChallenge[entry.challengeId] = 
        (existing.byChallenge[entry.challengeId] || 0) + entry.count;
      dataMap.set(entry.date, existing);
    }

    // Sort by date ascending
    return Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [entries]);

  // Get last 30 days of data for display
  const displayData = useMemo(() => {
    if (dailyData.length === 0) return [];
    return dailyData.slice(-30);
  }, [dailyData]);

  // Calculate filtered totals (only visible challenges)
  const filteredData = useMemo(() => {
    return displayData.map(day => ({
      ...day,
      filteredTotal: Object.entries(day.byChallenge)
        .filter(([id]) => visibleChallenges.has(id))
        .reduce((sum, [, count]) => sum + count, 0)
    }));
  }, [displayData, visibleChallenges]);

  const maxValue = useMemo(() => {
    if (filteredData.length === 0) return 100;
    return Math.max(...filteredData.map(d => d.filteredTotal), 1);
  }, [filteredData]);

  const toggleChallenge = (id: string) => {
    setVisibleChallenges(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (visibleChallenges.size === challenges.size) {
      setVisibleChallenges(new Set());
    } else {
      setVisibleChallenges(new Set(Array.from(challenges.keys())));
    }
  };

  if (entries.length === 0) {
    return (
      <div className={`bg-surface border border-border rounded-xl p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-ink mb-4">Progress</h3>
        <p className="text-sm text-muted">Log entries to see your progress over time.</p>
      </div>
    );
  }

  // SVG dimensions
  const width = 400;
  const height = 160;
  const padding = { top: 10, right: 10, bottom: 20, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Generate path for the line
  const linePath = filteredData.length > 1
    ? filteredData.map((d, i) => {
        const x = padding.left + (i / (filteredData.length - 1)) * chartWidth;
        const y = padding.top + chartHeight - (d.filteredTotal / maxValue) * chartHeight;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      }).join(' ')
    : '';

  // Generate area path (for fill)
  const areaPath = filteredData.length > 1
    ? `${linePath} L ${padding.left + chartWidth} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`
    : '';

  // Y-axis labels
  const yLabels = [0, Math.round(maxValue / 2), maxValue];

  return (
    <div className={`bg-surface border border-border rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-ink">Progress (Last 30 Days)</h3>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
          {/* Grid lines */}
          {yLabels.map((val, i) => {
            const y = padding.top + chartHeight - (val / maxValue) * chartHeight;
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
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {areaPath && (
            <path
              d={areaPath}
              fill="var(--color-accent)"
              fillOpacity={0.1}
            />
          )}

          {/* Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points */}
          {filteredData.map((d, i) => {
            const x = padding.left + (i / Math.max(filteredData.length - 1, 1)) * chartWidth;
            const y = padding.top + chartHeight - (d.filteredTotal / maxValue) * chartHeight;
            return (
              <circle
                key={d.date}
                cx={x}
                cy={y}
                r={3}
                fill="var(--color-accent)"
              />
            );
          })}

          {/* X-axis labels (first and last date) */}
          {filteredData.length > 0 && (
            <>
              <text
                x={padding.left}
                y={height - 5}
                className="fill-muted text-[10px]"
              >
                {formatDateShort(filteredData[0].date)}
              </text>
              <text
                x={width - padding.right}
                y={height - 5}
                textAnchor="end"
                className="fill-muted text-[10px]"
              >
                {formatDateShort(filteredData[filteredData.length - 1].date)}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Challenge filter toggles */}
      {challenges.size > 1 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={toggleAll}
              className="px-2 py-1 text-xs rounded border border-border text-muted hover:text-ink transition-colors"
            >
              {visibleChallenges.size === challenges.size ? "Hide all" : "Show all"}
            </button>
            {Array.from(challenges.entries()).map(([id, challenge]) => (
              <button
                key={id}
                onClick={() => toggleChallenge(id)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  visibleChallenges.has(id)
                    ? "bg-accent/10 text-accent border border-accent/30"
                    : "border border-border text-muted"
                }`}
              >
                <span style={{ color: challenge.color }}>{challenge.icon}</span>{" "}
                {challenge.name}
              </button>
            ))}
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

export default ProgressGraph;
