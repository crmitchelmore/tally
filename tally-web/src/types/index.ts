export type TimeframeUnit = "year" | "month" | "custom";

export type FeelingType = "very-easy" | "easy" | "moderate" | "hard" | "very-hard";

export interface SetData {
  reps: number;
}

// Alias for backwards compatibility
export type Set = SetData;

// Application types (compatible with both Convex and local development)
export interface User {
  id: string;
  clerkId: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  createdAt: string | number;
}

export interface Challenge {
  id: string;
  userId: string;
  name: string;
  targetNumber: number;
  year: number;
  color: string;
  icon: string;
  timeframeUnit?: TimeframeUnit;
  startDate?: string;
  endDate?: string;
  isPublic?: boolean;
  archived: boolean;
  createdAt: string | number;
}

export interface Entry {
  id: string;
  userId: string;
  challengeId: string;
  date: string;
  count: number;
  note?: string;
  sets?: SetData[];
  feeling?: FeelingType;
  createdAt?: string | number;
}

export interface FollowedChallenge {
  id: string;
  userId: string;
  challengeId: string;
  followedAt: string | number;
}

// Stats types
export interface ChallengeStats {
  total: number;
  remaining: number;
  daysLeft: number;
  requiredPerDay: number;
  currentStreak: number;
  longestStreak: number;
  bestDay: { date: string; count: number } | null;
  averagePerDay: number;
  daysActive: number;
  paceStatus: "ahead" | "onPace" | "behind";
  paceOffset: number;
}

export interface HeatmapDay {
  date: string;
  count: number;
  level: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl: string;
  challengeName: string;
  challengeId: string;
  totalReps: number;
  targetNumber: number;
  progress: number;
  daysActive: number;
  lastUpdated: string;
}

export interface PublicChallenge extends Challenge {
  ownerName?: string;
  ownerAvatarUrl?: string;
  totalReps?: number;
  progress?: number;
}
