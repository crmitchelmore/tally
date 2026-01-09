export type TimeframeUnit = "year" | "month" | "custom";
export type FeelingType = "very-easy" | "easy" | "moderate" | "hard" | "very-hard";

export interface User {
  _id: string;
  clerkId: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  createdAt: number;
}

export interface Challenge {
  _id: string;
  userId: string;
  name: string;
  targetNumber: number;
  year: number;
  color: string;
  icon: string;
  timeframeUnit: TimeframeUnit;
  startDate?: string;
  endDate?: string;
  isPublic: boolean;
  archived: boolean;
  createdAt: number;
}

export interface EntrySet {
  reps: number;
}

export interface Entry {
  _id: string;
  userId: string;
  challengeId: string;
  date: string;
  count: number;
  note?: string;
  sets?: EntrySet[];
  feeling?: FeelingType;
  createdAt: number;
}

export interface FollowedChallenge {
  _id: string;
  userId: string;
  challengeId: string;
  followedAt: number;
}

export interface ErrorResponse {
  error: string;
}
