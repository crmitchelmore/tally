"use client";

import { motion } from "framer-motion";
import { Challenge, Entry } from "@/types";
import { calculateStats, generateHeatmapData, getPaceMessage } from "@/lib/stats";
import { CircularProgress } from "./CircularProgress";
import { HeatmapCalendar } from "./HeatmapCalendar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, Flame } from "lucide-react";
import { useMotionPreference } from "@/hooks/use-reduced-motion";

interface ChallengeCardProps {
  challenge: Challenge;
  entries: Entry[];
  onClick: () => void;
}

export function ChallengeCard({ challenge, entries, onClick }: ChallengeCardProps) {
  const stats = calculateStats(challenge, entries);
  const heatmapData = generateHeatmapData(challenge, entries);
  const paceMessage = getPaceMessage(stats);
  const { shouldAnimate, tapScale, hoverY, hoverScale } = useMotionPreference();

  // Use CSS custom properties for status colors
  const paceColorVar =
    stats.paceStatus === "ahead"
      ? "var(--status-ahead)"
      : stats.paceStatus === "behind"
        ? "var(--status-behind)"
        : "var(--status-on-pace)";

  return (
    <motion.div
      whileHover={shouldAnimate ? { y: hoverY, scale: hoverScale } : undefined}
      whileTap={shouldAnimate ? { scale: tapScale } : undefined}
      transition={{ duration: 0.2 }}
    >
      <Card
        onClick={onClick}
        className="p-6 cursor-pointer bg-card border-2 border-border hover:border-primary/40 transition-all hover:shadow-xl relative overflow-hidden"
      >
        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{
            background: `repeating-linear-gradient(
              90deg,
              ${challenge.color},
              ${challenge.color} 8px,
              transparent 8px,
              transparent 12px
            )`,
          }}
        />
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-2xl font-semibold mb-1">{challenge.name}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {challenge.timeframeUnit
                  ? `Per ${challenge.timeframeUnit.charAt(0).toUpperCase() + challenge.timeframeUnit.slice(1)}`
                  : challenge.year}
              </Badge>
              {challenge.startDate && challenge.endDate && (
                <Badge variant="outline" className="text-xs">
                  {new Date(challenge.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                  {" → "}
                  {new Date(challenge.endDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Badge>
              )}
              {stats.currentStreak > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs flex items-center gap-1"
                  style={{
                    borderColor: "var(--status-streak)",
                    color: "var(--status-streak)",
                  }}
                >
                  <Flame className="w-3 h-3" />
                  {stats.currentStreak} day{stats.currentStreak !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>
          <CircularProgress
            value={stats.total}
            max={challenge.targetNumber}
            size={100}
            strokeWidth={10}
            color={challenge.color}
          />
        </div>

        <div className="mb-4">
          <div className="flex items-baseline gap-2 mb-1">
            <span
              className="text-4xl font-bold geist-mono"
              style={{ color: challenge.color }}
            >
              {stats.total.toLocaleString()}
            </span>
            <span className="text-xl text-muted-foreground">
              / {challenge.targetNumber.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mb-4 p-4 rounded-lg bg-secondary/50 border-2 border-border/50">
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                Remaining
              </div>
              <div className="text-lg font-bold geist-mono">
                {stats.remaining.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                Days left
              </div>
              <div className="text-lg font-bold geist-mono">{stats.daysLeft}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                Per day
              </div>
              <div
                className="text-lg font-bold geist-mono"
                style={{ color: paceColorVar }}
              >
                {stats.requiredPerDay}
              </div>
            </div>
          </div>
          <div
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: paceColorVar }}
          >
            {stats.paceStatus === "ahead" ? (
              <TrendingUp className="w-4 h-4" />
            ) : stats.paceStatus === "behind" ? (
              <TrendingDown className="w-4 h-4" />
            ) : (
              <Target className="w-4 h-4" />
            )}
            <span>{paceMessage}</span>
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
            Activity
          </div>
          <HeatmapCalendar data={heatmapData} year={challenge.year} size="small" />
        </div>
      </Card>
    </motion.div>
  );
}
