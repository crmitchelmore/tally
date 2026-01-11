/**
 * Convex Authentication & Authorization Helpers
 *
 * This module provides centralized auth helpers to enforce consistent
 * authorization patterns across all Convex mutations and queries.
 *
 * Security principles:
 * - Every mutation accessing user data MUST verify ownership
 * - Fail closed: deny by default, explicitly allow
 * - Use these helpers instead of manual auth checks
 */

import {
  QueryCtx,
  MutationCtx,
} from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Error thrown when authentication is required but user is not authenticated
 */
export class UnauthenticatedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

/**
 * Error thrown when user is authenticated but not authorized to access resource
 */
export class UnauthorizedError extends Error {
  constructor(message = "Not authorized to access this resource") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Get the authenticated user's identity from Clerk
 * Throws UnauthenticatedError if not logged in
 *
 * @example
 * const identity = await requireAuth(ctx);
 * console.log(identity.subject); // Clerk user ID
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx
): Promise<{ subject: string; tokenIdentifier: string }> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new UnauthenticatedError();
  }

  return {
    subject: identity.subject, // Clerk user ID
    tokenIdentifier: identity.tokenIdentifier,
  };
}

/**
 * Get the current user's database record
 * Returns null if not authenticated or user not found
 *
 * @example
 * const user = await getCurrentUser(ctx);
 * if (!user) return null; // Handle gracefully in queries
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  // Look up user by Clerk ID
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
}

/**
 * Get the current user's database record, throwing if not found
 * Use in mutations where auth is required
 *
 * @example
 * const user = await requireCurrentUser(ctx);
 * // user is guaranteed to exist
 */
export async function requireCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await requireAuth(ctx);

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    throw new UnauthenticatedError("User record not found");
  }

  return user;
}

/**
 * Assert that the current user owns a resource
 * Throws UnauthorizedError if not the owner
 *
 * @example
 * await assertOwner(ctx, challenge.userId);
 */
export async function assertOwner(
  ctx: QueryCtx | MutationCtx,
  resourceUserId: Id<"users">
): Promise<void> {
  const user = await requireCurrentUser(ctx);

  if (user._id !== resourceUserId) {
    throw new UnauthorizedError();
  }
}

/**
 * Assert ownership of a challenge
 * Fetches the challenge and verifies ownership in one call
 *
 * @example
 * const challenge = await assertChallengeOwner(ctx, challengeId);
 */
export async function assertChallengeOwner(
  ctx: QueryCtx | MutationCtx,
  challengeId: Id<"challenges">
) {
  const user = await requireCurrentUser(ctx);
  const challenge = await ctx.db.get(challengeId);

  if (!challenge) {
    throw new UnauthorizedError("Challenge not found");
  }

  if (challenge.userId !== user._id) {
    throw new UnauthorizedError();
  }

  return challenge;
}

/**
 * Assert ownership of an entry
 * Fetches the entry and verifies ownership in one call
 *
 * @example
 * const entry = await assertEntryOwner(ctx, entryId);
 */
export async function assertEntryOwner(
  ctx: QueryCtx | MutationCtx,
  entryId: Id<"entries">
) {
  const user = await requireCurrentUser(ctx);
  const entry = await ctx.db.get(entryId);

  if (!entry) {
    throw new UnauthorizedError("Entry not found");
  }

  if (entry.userId !== user._id) {
    throw new UnauthorizedError();
  }

  return entry;
}

/**
 * Check if a challenge is accessible to the current user
 * Returns true if:
 * - User owns the challenge
 * - Challenge is public
 * - User is following the challenge
 *
 * @example
 * const canAccess = await canAccessChallenge(ctx, challengeId);
 */
export async function canAccessChallenge(
  ctx: QueryCtx | MutationCtx,
  challengeId: Id<"challenges">
): Promise<boolean> {
  const challenge = await ctx.db.get(challengeId);

  if (!challenge) {
    return false;
  }

  // Public challenges are accessible to everyone
  if (challenge.isPublic) {
    return true;
  }

  // Check if authenticated user owns it
  const user = await getCurrentUser(ctx);
  if (!user) {
    return false;
  }

  if (challenge.userId === user._id) {
    return true;
  }

  // Check if user is following (using by_user index with filter)
  const follows = await ctx.db
    .query("followedChallenges")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .filter((q) => q.eq(q.field("challengeId"), challengeId))
    .collect();

  return follows.length > 0;
}
