/**
 * Server-side Convex client wrapper for API routes
 * Uses fetchQuery and fetchMutation for server-side calls
 */

import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

// Never share an authenticated client between requests: concurrent users must
// not be able to overwrite each other's bearer token.
export async function authenticatedClient() {
  const session = await auth();
  const token = session.userId
    ? await session.getToken()
    : (await headers()).get("authorization")?.replace(/^Bearer /, "");
  if (!token) throw new Error("Authentication required");
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  client.setAuth(token);
  return client;
}

// User operations
export const convexUsers = {
  getByClerkId: async (clerkId: string) =>
    (await authenticatedClient()).query(api.users.getByClerkId, { clerkId }),
  
  create: async (args: { clerkId: string; email: string; name: string }) =>
    (await authenticatedClient()).mutation(api.users.create, args),
  
  update: async (args: { id: Id<"users">; email?: string; name?: string }) =>
    (await authenticatedClient()).mutation(api.users.update, args),
  
  updatePreferences: async (args: {
    id: Id<"users">;
    dashboardConfig?: {
      panels: {
        highlights: boolean;
        personalRecords: boolean;
        progressGraph: boolean;
        burnUpChart: boolean;
        setsStats: boolean;
      };
      visible?: ("activeChallenges" | "highlights" | "personalRecords" | "progressGraph" | "burnUpChart")[];
      hidden?: ("activeChallenges" | "highlights" | "personalRecords" | "progressGraph" | "burnUpChart")[];
    };
  }) => (await authenticatedClient()).mutation(api.users.updatePreferences, args),
};

// Challenge operations
export const convexChallenges = {
  listByUser: async (userId: string) =>
    (await authenticatedClient()).query(api.challenges.listByUser, { userId }),
  
  listActive: async (userId: string) =>
    (await authenticatedClient()).query(api.challenges.listActive, { userId }),
  
  listPublic: async () =>
    (await authenticatedClient()).query(api.challenges.listPublic, {}),
  
  get: async (id: Id<"challenges">) =>
    (await authenticatedClient()).query(api.challenges.get, { id }),
  
  getIncludingDeleted: async (id: Id<"challenges">) =>
    (await authenticatedClient()).query(api.challenges.getIncludingDeleted, { id }),
  
  create: async (args: {
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
  }) => (await authenticatedClient()).mutation(api.challenges.create, args),
  
  update: async (args: {
    id: Id<"challenges">;
    name?: string;
    target?: number;
    color?: string;
    icon?: string;
    isPublic?: boolean;
    isArchived?: boolean;
    countType?: "simple" | "sets" | "custom";
    unitLabel?: string;
    defaultIncrement?: number;
  }) => (await authenticatedClient()).mutation(api.challenges.update, args),
  
  remove: async (id: Id<"challenges">, deletedBy?: string) =>
    (await authenticatedClient()).mutation(api.challenges.remove, { id, deletedBy }),
  
  restore: async (id: Id<"challenges">, userId: string) =>
    (await authenticatedClient()).mutation(api.challenges.restore, { id, userId }),
};

// Entry operations
export const convexEntries = {
  listByChallenge: async (challengeId: string) =>
    (await authenticatedClient()).query(api.entries.listByChallenge, { challengeId }),
  
  listByUser: async (userId: string) =>
    (await authenticatedClient()).query(api.entries.listByUser, { userId }),
  
  get: async (id: Id<"entries">) =>
    (await authenticatedClient()).query(api.entries.get, { id }),
  
  getIncludingDeleted: async (id: Id<"entries">) =>
    (await authenticatedClient()).query(api.entries.getIncludingDeleted, { id }),
  
  create: async (args: {
    userId: string;
    challengeId: string;
    date: string;
    count: number;
    sets?: number[];
    note?: string;
    feeling?: "great" | "good" | "okay" | "tough";
  }) => (await authenticatedClient()).mutation(api.entries.create, args),
  
  update: async (args: {
    id: Id<"entries">;
    date?: string;
    count?: number;
    sets?: number[];
    note?: string;
    feeling?: "great" | "good" | "okay" | "tough";
  }) => (await authenticatedClient()).mutation(api.entries.update, args),
  
  remove: async (id: Id<"entries">, deletedBy?: string) =>
    (await authenticatedClient()).mutation(api.entries.remove, { id, deletedBy }),
  
  restore: async (id: Id<"entries">, userId: string) =>
    (await authenticatedClient()).mutation(api.entries.restore, { id, userId }),
};

// Follow operations
export const convexFollows = {
  listByUser: async (userId: string) =>
    (await authenticatedClient()).query(api.follows.listByUser, { userId }),
  
  getFollowerCount: async (challengeId: string) =>
    (await authenticatedClient()).query(api.follows.getFollowerCount, { challengeId }),
  
  isFollowing: async (userId: string, challengeId: string) =>
    (await authenticatedClient()).query(api.follows.isFollowing, { userId, challengeId }),
  
  follow: async (userId: string, challengeId: string) =>
    (await authenticatedClient()).mutation(api.follows.follow, { userId, challengeId }),
  
  unfollow: async (userId: string, challengeId: string, deletedBy?: string) =>
    (await authenticatedClient()).mutation(api.follows.unfollow, { userId, challengeId, deletedBy }),
};
