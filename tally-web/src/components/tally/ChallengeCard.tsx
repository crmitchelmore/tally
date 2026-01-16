"use client";

import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { Challenge, Entry } from "@/types";
import { calculateStats, formatPaceStatus } from "@/lib/stats";
import { AddEntrySheet } from "./AddEntrySheet";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ChallengeCardProps {
  challenge: Challenge;
  onClick?: () => void;
}

export function ChallengeCard({ challenge, onClick }: ChallengeCardProps) {
  const { user } = useUser();
  const entries = useQuery(
    api.entries.listByChallenge,
    user?.id ? { clerkId: user.id, challengeId: challenge._id } : "skip"
  );

  const stats = entries ? calculateStats(challenge, entries as Entry[]) : null;
  const pace = stats ? formatPaceStatus(stats.paceStatus) : null;
  const progress = stats ? Math.min(100, (stats.total / challenge.targetNumber) * 100) : 0;

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onClick}>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
            style={{ backgroundColor: challenge.color + "20", color: challenge.color }}
          >
            {challenge.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{challenge.name}</h3>
            {pace && (
              <p className={`text-sm ${pace.color}`}>{pace.text}</p>
            )}
          </div>
        </div>
        <AddEntrySheet 
          challengeId={challenge._id}
          trigger={
            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          }
        />
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500">Progress</span>
          <span className="font-medium">{stats?.total ?? 0} / {challenge.targetNumber}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${progress}%`,
              backgroundColor: challenge.color 
            }}
          />
        </div>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.daysLeft}</p>
            <p className="text-xs text-gray-500">Days left</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.currentStreak}</p>
            <p className="text-xs text-gray-500">Streak</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.requiredPerDay.toFixed(1)}</p>
            <p className="text-xs text-gray-500">Per day</p>
          </div>
        </div>
      )}
    </div>
  );
}
