import type { QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

/** Resolve legacy database IDs against the verified Clerk identity, never the caller. */
export async function requireOwner(ctx: QueryCtx, ownerId: string): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Authentication required");
  if (ownerId === identity.subject) return identity.subject;
  const users = await ctx.db.query("users")
    .withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject)).collect();
  if (!users.some(user => String(user._id) === ownerId)) throw new Error("Not authorized");
  return identity.subject;
}

export async function requireChallengeOwner(ctx: QueryCtx, challengeId: string): Promise<Doc<"challenges">> {
  const id = ctx.db.normalizeId("challenges", challengeId);
  const challenge = id ? await ctx.db.get(id) : null;
  if (!challenge) throw new Error("Challenge not found");
  await requireOwner(ctx, challenge.userId);
  return challenge;
}

export async function requireEntryOwner(ctx: QueryCtx, entryId: string): Promise<Doc<"entries">> {
  const id = ctx.db.normalizeId("entries", entryId);
  const entry = id ? await ctx.db.get(id) : null;
  if (!entry) throw new Error("Entry not found");
  await requireOwner(ctx, entry.userId);
  await requireChallengeOwner(ctx, entry.challengeId);
  return entry;
}

export async function requireUserOwner(ctx: QueryCtx, userId: string): Promise<Doc<"users">> {
  const id = ctx.db.normalizeId("users", userId);
  const user = id ? await ctx.db.get(id) : null;
  if (!user) throw new Error("User not found");
  await requireOwner(ctx, user.clerkId);
  return user;
}
