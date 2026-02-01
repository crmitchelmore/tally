/**
 * API v1 types – shared between routes and store.
 */

// User
export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  dashboardConfig?: DashboardConfig;
  createdAt: string;
  updatedAt: string;
}

// Challenge timeframe types
export type TimeframeType = "year" | "month" | "custom";

// Count type for challenges
export type CountType = "simple" | "sets" | "custom";

// Common unit presets
export const UNIT_PRESETS = [
  { value: "reps", label: "Reps" },
  { value: "minutes", label: "Minutes" },
  { value: "pages", label: "Pages" },
  { value: "km", label: "Kilometers" },
  { value: "miles", label: "Miles" },
  { value: "hours", label: "Hours" },
  { value: "items", label: "Items" },
  { value: "sessions", label: "Sessions" },
] as const;

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
  // Count configuration (optional for backward compatibility)
  countType?: CountType;
  unitLabel?: string; // e.g., "reps", "minutes", "pages"
  defaultIncrement?: number; // quick-add increment (e.g., 1, 5, 10)
  createdAt: string;
  updatedAt: string;
}

// Entry - supports both simple count and sets/reps
export interface Entry {
  id: string;
  userId: string;
  challengeId: string;
  date: string; // ISO date (YYYY-MM-DD)
  count: number;
  // Optional sets breakdown (for sets/reps count type)
  sets?: number[]; // e.g., [20, 15, 12] for 3 sets
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
  periodOffset?: number; // 0 = current period, 1 = next period (for year/month)
  startDate?: string; // For custom timeframe
  endDate?: string; // For custom timeframe
  color?: string;
  icon?: string;
  isPublic?: boolean;
  // Count configuration
  countType?: CountType;
  unitLabel?: string;
  defaultIncrement?: number;
}

export interface UpdateChallengeRequest {
  name?: string;
  target?: number;
  color?: string;
  icon?: string;
  isPublic?: boolean;
  isArchived?: boolean;
  // Count configuration
  countType?: CountType;
  unitLabel?: string;
  defaultIncrement?: number;
}

export interface CreateEntryRequest {
  challengeId: string;
  date: string;
  count: number;
  sets?: number[]; // Optional sets breakdown
  note?: string;
  feeling?: "great" | "good" | "okay" | "tough";
}

export interface UpdateEntryRequest {
  date?: string;
  count?: number;
  sets?: number[]; // Optional sets breakdown
  note?: string;
  feeling?: "great" | "good" | "okay" | "tough";
}

// Dashboard panel configuration
export type DashboardPanelKey =
  | "highlights"
  | "personalRecords"
  | "progressGraph"
  | "burnUpChart"
  | "activeChallenges";

export interface DashboardConfig {
  panels: {
    highlights: boolean;
    personalRecords: boolean;
    progressGraph: boolean;
    burnUpChart: boolean;
    setsStats: boolean;
  };
  visible?: DashboardPanelKey[];
  hidden?: DashboardPanelKey[];
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
  // Sets-specific stats (only populated when user has sets-based challenges)
  bestSet?: { value: number; date: string; challengeId: string };
  avgSetValue?: number;
}

export interface PersonalRecords {
  bestSingleDay: { date: string; count: number } | null;
  longestStreak: number;
  highestDailyAverage: { challengeId: string; average: number } | null;
  mostActiveDays: number;
  biggestSingleEntry: { date: string; count: number; challengeId: string } | null;
  // Sets-specific records
  bestSet?: { value: number; date: string; challengeId: string };
  avgSetValue?: number;
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
