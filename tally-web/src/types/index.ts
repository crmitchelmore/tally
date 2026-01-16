import { Id } from "../../convex/_generated/dataModel";

export type Feeling = "very-easy" | "easy" | "moderate" | "hard" | "very-hard";

export type TimeframeUnit = "year" | "month" | "custom";

export interface User {
  _id: Id<"users">;
  clerkId: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  createdAt: number;
}

export interface Challenge {
  _id: Id<"challenges">;
  userId: Id<"users">;
  name: string;
  targetNumber: number;
  color: string;
  icon: string;
  timeframeUnit: TimeframeUnit;
  startDate?: string;
  endDate?: string;
  year: number;
  isPublic: boolean;
  archived: boolean;
  createdAt: number;
}

export interface Entry {
  _id: Id<"entries">;
  userId: Id<"users">;
  challengeId: Id<"challenges">;
  date: string;
  count: number;
  note?: string;
  sets?: { reps: number }[];
  feeling?: Feeling;
  createdAt: number;
}

export interface FollowedChallenge {
  _id: Id<"followedChallenges">;
  userId: Id<"users">;
  challengeId: Id<"challenges">;
  followedAt: number;
}

export type PaceStatus = "ahead" | "onPace" | "behind";

export interface ChallengeStats {
  total: number;
  remaining: number;
  daysLeft: number;
  requiredPerDay: number;
  paceStatus: PaceStatus;
  paceOffset: number;
  currentStreak: number;
  longestStreak: number;
  bestDay: { date: string; count: number } | null;
  averagePerDay: number;
  daysActive: number;
}
