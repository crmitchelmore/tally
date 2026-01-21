/**
 * Server-side Convex client wrapper for API routes
 * Uses fetchQuery and fetchMutation for server-side calls
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// User operations
export const convexUsers = {
  getByClerkId: (clerkId: string) =>
    client.query(api.users.getByClerkId, { clerkId }),
  
  create: (args: { clerkId: string; email: string; name: string }) =>
    client.mutation(api.users.create, args),
  
  update: (args: { id: Id<"users">; email?: string; name?: string }) =>
    client.mutation(api.users.update, args),
};

// Challenge operations
export const convexChallenges = {
  listByUser: (userId: string) =>
    client.query(api.challenges.listByUser, { userId }),
  
  listActive: (userId: string) =>
    client.query(api.challenges.listActive, { userId }),
  
  listPublic: () =>
    client.query(api.challenges.listPublic, {}),
  
  get: (id: Id<"challenges">) =>
    client.query(api.challenges.get, { id }),
  
  create: (args: {
    userId: string;
    name: string;
    target: number;
    timeframeType: "year" | "month" | "custom";
    startDate: string;
    endDate: string;
    color: string;
    icon: string;
    isPublic: boolean;
    countType?: "simple" | "sets" | "custom";
    unitLabel?: string;
    defaultIncrement?: number;
  }) => client.mutation(api.challenges.create, args),
  
  update: (args: {
    id: Id<"challenges">;
    name?: string;
    target?: number;
    color?: string;
    icon?: string;
    isPublic?: boolean;
    isArchived?: boolean;
  }) => client.mutation(api.challenges.update, args),
  
  remove: (id: Id<"challenges">) =>
    client.mutation(api.challenges.remove, { id }),
};

// Entry operations
export const convexEntries = {
  listByChallenge: (challengeId: string) =>
    client.query(api.entries.listByChallenge, { challengeId }),
  
  listByUser: (userId: string) =>
    client.query(api.entries.listByUser, { userId }),
  
  get: (id: Id<"entries">) =>
    client.query(api.entries.get, { id }),
  
  create: (args: {
    userId: string;
    challengeId: string;
    date: string;
    count: number;
    note?: string;
    feeling?: "great" | "good" | "okay" | "tough";
  }) => client.mutation(api.entries.create, args),
  
  update: (args: {
    id: Id<"entries">;
    date?: string;
    count?: number;
    note?: string;
    feeling?: "great" | "good" | "okay" | "tough";
  }) => client.mutation(api.entries.update, args),
  
  remove: (id: Id<"entries">) =>
    client.mutation(api.entries.remove, { id }),
};

// Follow operations
export const convexFollows = {
  listByUser: (userId: string) =>
    client.query(api.follows.listByUser, { userId }),
  
  getFollowerCount: (challengeId: string) =>
    client.query(api.follows.getFollowerCount, { challengeId }),
  
  isFollowing: (userId: string, challengeId: string) =>
    client.query(api.follows.isFollowing, { userId, challengeId }),
  
  follow: (userId: string, challengeId: string) =>
    client.mutation(api.follows.follow, { userId, challengeId }),
  
  unfollow: (userId: string, challengeId: string) =>
    client.mutation(api.follows.unfollow, { userId, challengeId }),
};
