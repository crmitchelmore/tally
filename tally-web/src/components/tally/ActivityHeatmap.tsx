import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Entry } from "@/types";

interface ActivityHeatmapProps {
  entries: Entry[];
  year: number;
  color?: string;
  className?: string;
}

const CELL_SIZE = 12;

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

export function ActivityHeatmap({
  entries,
  year,
  color = "var(--slash)",
  className,
}: ActivityHeatmapProps) {
  const { weeks, maxCount, counts } = useMemo(() => {
    const countsByDate: Record<string, number> = {};
    for (const entry of entries) {
      if (!entry.date.startsWith(`${year}-`)) continue;
      countsByDate[entry.date] = (countsByDate[entry.date] || 0) + entry.count;
    }

    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year, 11, 31));
    const weeksGrid: Array<Array<Date | null>> = [];
    let current = new Date(start);
    let week: Array<Date | null> = Array(7).fill(null);
    let dayIndex = current.getUTCDay();

    while (current <= end) {
      week[dayIndex] = new Date(current);
      dayIndex += 1;
      if (dayIndex === 7) {
        weeksGrid.push(week);
        week = Array(7).fill(null);
        dayIndex = 0;
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }

    if (week.some((day) => day !== null)) {
      weeksGrid.push(week);
    }

    const max = Object.values(countsByDate).reduce((acc, value) => Math.max(acc, value), 0);
    return { weeks: weeksGrid, maxCount: max, counts: countsByDate };
  }, [entries, year]);

  const getIntensity = (count: number) => {
    if (count === 0 || maxCount === 0) return 0;
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  };

  const resolveColor = (level: number) => {
    if (level === 0) return "var(--paper-cream)";
    if (color.startsWith("#")) {
      const alpha = [0, 0.25, 0.4, 0.6, 0.85][level];
      return hexToRgba(color, alpha);
    }
    return color;
  };

  return (
    <div className={cn("flex gap-1 overflow-x-auto py-2", className)}>
      {weeks.map((week, weekIndex) => (
        <div key={`week-${weekIndex}`} className="flex flex-col gap-1">
          {week.map((day, dayIndex) => {
            if (!day) {
              return <div key={`empty-${weekIndex}-${dayIndex}`} style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
            }

            const dateKey = formatDate(day);
            const count = counts[dateKey] || 0;
            const level = getIntensity(count);
            const background = resolveColor(level);

            return (
              <div
                key={dateKey}
                title={`${dateKey}: ${count}`}
                className="rounded-[3px] border border-[var(--border-light)]"
                style={{ width: CELL_SIZE, height: CELL_SIZE, background }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
