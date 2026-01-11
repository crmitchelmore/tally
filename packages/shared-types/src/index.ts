/**
 * Tally Shared Types
 *
 * Cross-platform API contract definitions. These DTOs are the canonical
 * representation of data across web, iOS, and Android clients.
 *
 * Note: Convex uses `_id` internally, but API responses use `id: string`.
 * The http.ts adapter layer handles this transformation.
 */

export type TimeframeUnit = "year" | "month" | "custom";
export type FeelingType = "very-easy" | "easy" | "moderate" | "hard" | "very-hard";

// =============================================================================
// Core DTOs (API contract - uses `id` not `_id`)
// =============================================================================

export interface UserDTO {
  id: string;
  clerkId: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  createdAt: number;
}

export interface ChallengeDTO {
  id: string;
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

export interface EntrySetDTO {
  reps: number;
}

export interface EntryDTO {
  id: string;
  userId: string;
  challengeId: string;
  date: string;
  count: number;
  note?: string;
  sets?: EntrySetDTO[];
  feeling?: FeelingType;
  createdAt: number;
}

export interface FollowedChallengeDTO {
  id: string;
  userId: string;
  challengeId: string;
  followedAt: number;
}

// =============================================================================
// API Request/Response types
// =============================================================================

export interface ErrorResponse {
  error: string;
}

export interface SuccessResponse {
  success: true;
}

export interface CreateResponse {
  id: string;
}

export interface AuthUserResponse {
  userId: string;
  clerkId: string;
}

// Challenge creation/update
export interface CreateChallengeRequest {
  name: string;
  targetNumber: number;
  year: number;
  color: string;
  icon: string;
  timeframeUnit: TimeframeUnit;
  startDate?: string;
  endDate?: string;
  isPublic?: boolean;
}

export interface UpdateChallengeRequest {
  name?: string;
  targetNumber?: number;
  color?: string;
  icon?: string;
  isPublic?: boolean;
  archived?: boolean;
}

// Entry creation/update
export interface CreateEntryRequest {
  challengeId: string;
  date: string;
  count: number;
  note?: string;
  sets?: EntrySetDTO[];
  feeling?: FeelingType;
}

export interface UpdateEntryRequest {
  count?: number;
  note?: string;
  date?: string;
  sets?: EntrySetDTO[];
  feeling?: FeelingType;
}

// Follow
export interface FollowChallengeRequest {
  challengeId: string;
}

// =============================================================================
// Statistics and computed types
// =============================================================================

export type PaceStatus = "ahead" | "onPace" | "behind";

export interface ChallengeStatsDTO {
  total: number;
  remaining: number;
  daysLeft: number;
  requiredPerDay: number;
  currentStreak: number;
  longestStreak: number;
  bestDay: { date: string; count: number } | null;
  averagePerDay: number;
  daysActive: number;
  paceStatus: PaceStatus;
  paceOffset: number;
}

export interface HeatmapDayDTO {
  date: string;
  count: number;
  level: number; // 0-4
}

export interface LeaderboardEntryDTO {
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

export interface PublicChallengeDTO extends ChallengeDTO {
  ownerName?: string;
  ownerAvatarUrl?: string;
  totalReps?: number;
  progress?: number;
}

// =============================================================================
// Legacy aliases (for backwards compatibility during migration)
// =============================================================================

/** @deprecated Use UserDTO instead */
export interface User {
  _id: string;
  clerkId: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  createdAt: number;
}

/** @deprecated Use ChallengeDTO instead */
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

/** @deprecated Use EntrySetDTO instead */
export interface EntrySet {
  reps: number;
}

/** @deprecated Use EntryDTO instead */
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

/** @deprecated Use FollowedChallengeDTO instead */
export interface FollowedChallenge {
  _id: string;
  userId: string;
  challengeId: string;
  followedAt: number;
}
