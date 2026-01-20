"use client";

import { useMemo } from "react";
import type { Entry } from "@/app/api/v1/_lib/types";

export interface ActivityHeatmapProps {
  entries: Entry[];
  startDate: string;
  endDate: string;
  color?: string;
  onDayClick?: (date: string, count: number) => void;
}

/**
 * Yearly activity heatmap component.
 * Shows daily activity intensity with per-day drilldown on click.
 */
export function ActivityHeatmap({
  entries,
  startDate,
  endDate,
  color = "#FF4747",
  onDayClick,
}: ActivityHeatmapProps) {
  // Group entries by date
  const entriesByDate = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((e) => {
      map.set(e.date, (map.get(e.date) || 0) + e.count);
    });
    return map;
  }, [entries]);

  // Calculate max count for intensity scaling
  const maxCount = useMemo(() => {
    if (entriesByDate.size === 0) return 1;
    return Math.max(...Array.from(entriesByDate.values()));
  }, [entriesByDate]);

  // Generate weeks array for the date range
  const weeks = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result: { date: string; count: number; isToday: boolean; isFuture: boolean }[][] = [];
    let currentWeek: { date: string; count: number; isToday: boolean; isFuture: boolean }[] = [];
    
    // Start from the Sunday of the start week
    const current = new Date(start);
    current.setDate(current.getDate() - current.getDay());
    
    while (current <= end || currentWeek.length > 0) {
      const dateStr = current.toISOString().split("T")[0];
      const isInRange = current >= start && current <= end;
      const isToday = current.toDateString() === today.toDateString();
      const isFuture = current > today;
      
      currentWeek.push({
        date: isInRange ? dateStr : "",
        count: isInRange ? (entriesByDate.get(dateStr) || 0) : 0,
        isToday,
        isFuture: isInRange && isFuture,
      });
      
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
      
      current.setDate(current.getDate() + 1);
      
      // Stop if we've passed the end date and completed the week
      if (current > end && currentWeek.length === 0) break;
    }
    
    // Handle partial final week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: "", count: 0, isToday: false, isFuture: false });
      }
      result.push(currentWeek);
    }
    
    return result;
  }, [startDate, endDate, entriesByDate]);

  // Get intensity level (0-4) for a count
  const getIntensity = (count: number): number => {
    if (count === 0) return 0;
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  };

  // Generate month labels
  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    
    weeks.forEach((week, weekIndex) => {
      const firstValidDay = week.find((d) => d.date);
      if (firstValidDay) {
        const month = new Date(firstValidDay.date).getMonth();
        if (month !== lastMonth) {
          labels.push({
            month: new Date(firstValidDay.date).toLocaleDateString("en-US", { month: "short" }),
            weekIndex,
          });
          lastMonth = month;
        }
      }
    });
    
    return labels;
  }, [weeks]);

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        {/* Month labels */}
        <div className="flex mb-1 ml-8">
          {monthLabels.map(({ month, weekIndex }, i) => (
            <span
              key={i}
              className="text-xs text-muted"
              style={{
                marginLeft: i === 0 ? `${weekIndex * 14}px` : `${(weekIndex - (monthLabels[i - 1]?.weekIndex || 0)) * 14 - 28}px`,
              }}
            >
              {month}
            </span>
          ))}
        </div>

        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 pr-1">
            {dayLabels.map((label, i) => (
              <span key={i} className="text-[10px] text-muted h-[12px] leading-[12px] w-6 text-right">
                {label}
              </span>
            ))}
          </div>

          {/* Heatmap grid */}
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-0.5">
              {week.map((day, dayIndex) => {
                if (!day.date) {
                  return <div key={dayIndex} className="w-[12px] h-[12px]" />;
                }

                const intensity = getIntensity(day.count);
                const isClickable = day.count > 0 && onDayClick;

                return (
                  <button
                    key={dayIndex}
                    type="button"
                    disabled={!isClickable}
                    onClick={() => isClickable && onDayClick(day.date, day.count)}
                    className={`
                      w-[12px] h-[12px] rounded-sm
                      transition-transform
                      ${isClickable ? "hover:scale-125 cursor-pointer" : "cursor-default"}
                      ${day.isToday ? "ring-1 ring-accent ring-offset-1" : ""}
                      ${day.isFuture ? "opacity-30" : ""}
                    `}
                    style={{
                      backgroundColor:
                        intensity === 0
                          ? "var(--color-border)"
                          : intensity === 1
                          ? `color-mix(in oklch, ${color} 25%, var(--color-border))`
                          : intensity === 2
                          ? `color-mix(in oklch, ${color} 50%, var(--color-border))`
                          : intensity === 3
                          ? `color-mix(in oklch, ${color} 75%, var(--color-border))`
                          : color,
                    }}
                    title={`${day.date}: ${day.count} ${day.count === 1 ? "mark" : "marks"}`}
                    aria-label={`${day.date}: ${day.count} marks`}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-3">
          <span className="text-xs text-muted">Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className="w-[12px] h-[12px] rounded-sm"
              style={{
                backgroundColor:
                  level === 0
                    ? "var(--color-border)"
                    : level === 1
                    ? `color-mix(in oklch, ${color} 25%, var(--color-border))`
                    : level === 2
                    ? `color-mix(in oklch, ${color} 50%, var(--color-border))`
                    : level === 3
                    ? `color-mix(in oklch, ${color} 75%, var(--color-border))`
                    : color,
              }}
            />
          ))}
          <span className="text-xs text-muted">More</span>
        </div>
      </div>
    </div>
  );
}

export default ActivityHeatmap;
