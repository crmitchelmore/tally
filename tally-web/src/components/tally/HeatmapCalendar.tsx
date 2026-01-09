"use client";

import { HeatmapDay } from "@/types";
import { getHeatmapColor } from "@/lib/stats";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeatmapCalendarProps {
  data: HeatmapDay[];
  year: number;
  size?: "small" | "large";
  onDayClick?: (day: HeatmapDay) => void;
}

export function HeatmapCalendar({
  data,
  year,
  size = "small",
  onDayClick,
}: HeatmapCalendarProps) {
  const squareSize = size === "small" ? 12 : 16;
  const gap = size === "small" ? 2 : 3;

  const weeks: HeatmapDay[][] = [];

  const firstDayOfYear = new Date(year, 0, 1);
  let startDay = firstDayOfYear.getDay();
  if (startDay === 0) startDay = 7;

  const grid: (HeatmapDay | null)[] = [];

  for (let i = 1; i < startDay; i++) {
    grid.push(null);
  }

  data.forEach((day) => {
    grid.push(day);
  });

  for (let col = 0; col < Math.ceil(grid.length / 7); col++) {
    const week: HeatmapDay[] = [];
    for (let row = 0; row < 7; row++) {
      const index = col * 7 + row;
      if (index < grid.length && grid[index]) {
        week.push(grid[index]!);
      } else {
        week.push({ date: "", count: 0, level: 0 });
      }
    }
    weeks.push(week);
  }

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return (
    <TooltipProvider>
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex flex-col gap-1">
          {size === "large" && (
            <div className="flex gap-1 ml-8 text-xs text-muted-foreground">
              {months.map((month) => (
                <div key={month} style={{ width: squareSize * 4.3 }}>
                  {month}
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-1">
            {size === "large" && (
              <div className="flex flex-col justify-around text-xs text-muted-foreground pr-2">
                <div>Mon</div>
                <div>Wed</div>
                <div>Fri</div>
              </div>
            )}
            <div className="flex" style={{ gap }}>
              {weeks.map((week, weekIndex) => (
                <div
                  key={weekIndex}
                  className="flex flex-col"
                  style={{ gap }}
                >
                  {week.map((day, dayIndex) => {
                    if (!day.date) {
                      return (
                        <div
                          key={dayIndex}
                          style={{
                            width: squareSize,
                            height: squareSize,
                          }}
                        />
                      );
                    }

                    const date = new Date(day.date);
                    const formattedDate = date.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    });

                    return (
                      <Tooltip key={day.date}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onDayClick?.(day)}
                            style={{
                              width: squareSize,
                              height: squareSize,
                              backgroundColor: getHeatmapColor(day.level),
                              border: "1px solid oklch(0.85 0.01 50)",
                            }}
                            className="rounded-sm hover:ring-2 hover:ring-accent/50 transition-all"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{formattedDate}</p>
                          <p className="text-sm">
                            {day.count > 0 ? `${day.count} reps` : "No activity"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
