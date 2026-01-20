/**
 * API v1 types – shared between routes and store.
 */

// User
export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Challenge timeframe types
export type TimeframeType = "year" | "month" | "custom";

// Challenge
export interface Challenge {
  id: string;
  userId: string;
  name: string;
  target: number;
  timeframeType: TimeframeType;
  startDate: string; // ISO date
  endDate: string; // ISO date
  color: string;
  icon: string;
  isPublic: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// Entry
export interface Entry {
  id: string;
  userId: string;
  challengeId: string;
  date: string; // ISO date (YYYY-MM-DD)
  count: number;
  note?: string;
  feeling?: "great" | "good" | "okay" | "tough";
  createdAt: string;
  updatedAt: string;
}

// Follow relationship
export interface Follow {
  id: string;
  userId: string;
  challengeId: string;
  createdAt: string;
}

// API request/response types
export interface CreateChallengeRequest {
  name: string;
  target: number;
  timeframeType: TimeframeType;
  startDate?: string;
  endDate?: string;
  color?: string;
  icon?: string;
  isPublic?: boolean;
}

export interface UpdateChallengeRequest {
  name?: string;
  target?: number;
  color?: string;
  icon?: string;
  isPublic?: boolean;
  isArchived?: boolean;
}

export interface CreateEntryRequest {
  challengeId: string;
  date: string;
  count: number;
  note?: string;
  feeling?: "great" | "good" | "okay" | "tough";
}

export interface UpdateEntryRequest {
  date?: string;
  count?: number;
  note?: string;
  feeling?: "great" | "good" | "okay" | "tough";
}

// Stats types
export interface ChallengeStats {
  challengeId: string;
  totalCount: number;
  remaining: number;
  daysElapsed: number;
  daysRemaining: number;
  perDayRequired: number;
  currentPace: number;
  paceStatus: "ahead" | "on-pace" | "behind";
  streakCurrent: number;
  streakBest: number;
  bestDay: { date: string; count: number } | null;
  dailyAverage: number;
}

export interface DashboardStats {
  totalMarks: number;
  today: number;
  bestStreak: number;
  overallPaceStatus: "ahead" | "on-pace" | "behind" | "none";
}

export interface PersonalRecords {
  bestSingleDay: { date: string; count: number } | null;
  longestStreak: number;
  highestDailyAverage: { challengeId: string; average: number } | null;
  mostActiveDays: number;
  biggestSingleEntry: { date: string; count: number; challengeId: string } | null;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Error response
export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, string>;
}

// Validation error
export interface ValidationError {
  field: string;
  message: string;
}
