import { v, ConvexError } from "convex/values";
import { query, mutation, type QueryCtx } from "./_generated/server";
import { toApiFormat as entryFormat, insertEntry } from "./entries";
import { toApiFormat as challengeFormat } from "./challenges";
import { validateCreateEntry } from "../src/app/api/v1/_lib/validate";

export const scope = v.union(v.literal("challenges:read"), v.literal("entries:write"));
async function owner(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ code: "UNAUTHORIZED" });
  return identity.subject;
}
export const create = mutation({
  args: { name: v.string(), digest: v.string(), prefix: v.string(), scopes: v.array(scope) },
  handler: async (ctx, args) => {
    const userId = await owner(ctx);
    if (!args.name.trim() || args.name.length > 80 || !/^[a-f0-9]{64}$/.test(args.digest) || !/^tally_[a-f0-9]{8}$/.test(args.prefix) || !args.scopes.length) throw new ConvexError({code:"INVALID_INPUT"});
    // A digest is a bearer capability at this boundary. Never allow another
    // registration to shadow its owner or make unique() fail (including revoked keys).
    const existing = await ctx.db.query("apiKeys").withIndex("by_digest", q => q.eq("digest", args.digest)).unique();
    if (existing) throw new ConvexError({code:"KEY_EXISTS"});
    const keys = await ctx.db.query("apiKeys").withIndex("by_owner", q => q.eq("userId", userId)).collect();
    if (keys.filter(k => k.revokedAt === undefined).length >= 20) throw new ConvexError({code:"KEY_LIMIT"});
    return ctx.db.insert("apiKeys", {...args, name: args.name.trim(), scopes: [...new Set(args.scopes)], userId, createdAt: Date.now()});
  },
});
export const list = query({args: {}, handler: async ctx => {
  const userId = await owner(ctx);
  return (await ctx.db.query("apiKeys").withIndex("by_owner", q => q.eq("userId", userId)).collect()).map(({_id, name, prefix, scopes, createdAt, revokedAt}) => ({id:_id, name, prefix, scopes, createdAt, revokedAt}));
}});
export const revoke = mutation({args:{id:v.id("apiKeys")}, handler: async (ctx, {id}) => {
  const userId = await owner(ctx);
  const key = await ctx.db.get(id);
  if (!key || key.userId !== userId) throw new ConvexError({code:"FORBIDDEN"});
  if (key.revokedAt === undefined) await ctx.db.patch(id, {revokedAt:Date.now()});
}});
// These narrowly scoped functions authenticate the opaque capability themselves.
// They never accept an owner ID; raw keys are hashed in Next.js, not sent to Convex.
async function capability(ctx: QueryCtx, digest: string, required: "challenges:read" | "entries:write") {
  const key = await ctx.db.query("apiKeys").withIndex("by_digest", q => q.eq("digest", digest)).unique();
  if (!key || key.revokedAt !== undefined) throw new ConvexError({code:"UNAUTHORIZED"});
  if (!key.scopes.includes(required)) throw new ConvexError({code:"FORBIDDEN"});
  return key;
}
export const challenges = query({args:{digest:v.string(), includeArchived:v.boolean()}, handler: async (ctx, args) => {
  const key = await capability(ctx, args.digest, "challenges:read");
  const users = await ctx.db.query("users").withIndex("by_clerk_id", q => q.eq("clerkId", key.userId)).collect();
  const ids = [key.userId, ...users.map(u => String(u._id))];
  const result = [];
  for (const userId of ids) {
    const goals = await ctx.db.query("challenges").withIndex("by_user_id", q => q.eq("userId", userId)).collect();
    for (const goal of goals.filter(g => g.deletedAt === undefined && (args.includeArchived || (!g.isArchived && g.endDate >= new Date().toISOString().slice(0,10))))) {
      const entries = await ctx.db.query("entries").withIndex("by_challenge_id", q => q.eq("challengeId", String(goal._id))).collect();
      result.push({challenge:challengeFormat(goal), entries:entries.filter(e => e.deletedAt === undefined).map(entryFormat)});
    }
  }
  return result;
}});
export const createEntry = mutation({args:{digest:v.string(), entry:v.object({challengeId:v.string(), date:v.string(), count:v.number(), note:v.optional(v.string()), feeling:v.optional(v.union(v.literal("great"),v.literal("good"),v.literal("okay"),v.literal("tough"))), sets:v.optional(v.array(v.number())), externalEventId:v.string(), timeZone:v.optional(v.string())})}, handler: async (ctx, args) => {
  const key = await capability(ctx, args.digest, "entries:write");
  if (!validateCreateEntry(args.entry).valid) throw new ConvexError({code:"INVALID_INPUT"});
  const id = ctx.db.normalizeId("challenges", args.entry.challengeId);
  const challenge = id ? await ctx.db.get(id) : null;
  if (!challenge || challenge.deletedAt !== undefined) throw new ConvexError({code:"NOT_FOUND"});
  const users = await ctx.db.query("users").withIndex("by_clerk_id", q => q.eq("clerkId", key.userId)).collect();
  if (![key.userId, ...users.map(u => String(u._id))].includes(challenge.userId)) throw new ConvexError({code:"FORBIDDEN"});
  return insertEntry(ctx, key.userId, args.entry, key.userId);
}});
