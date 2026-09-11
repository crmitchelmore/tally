import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";

async function signedIn(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Authentication required");
  return identity.subject;
}

async function moderator(ctx: QueryCtx) {
  const subject = await signedIn(ctx);
  const allowed = (process.env.COMMUNITY_MODERATOR_IDS ?? "").split(",").map(id => id.trim()).filter(Boolean);
  if (!allowed.includes(subject)) throw new Error("Moderator access required");
  return subject;
}

/** Reporting immediately hides the reported goal until a human has reviewed it. */
export const report = mutation({
  args: {
    challengeId: v.id("challenges"),
    reason: v.union(v.literal("abuse"), v.literal("sexual"), v.literal("violence"), v.literal("spam"), v.literal("other")),
    detail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reporterId = await signedIn(ctx);
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge || challenge.deletedAt !== undefined || (!challenge.isPublic && !challenge.moderationStatus)) {
      throw new Error("Content unavailable");
    }
    if ((args.detail?.length ?? 0) > 1000) throw new Error("Keep the report under 1,000 characters");
    const existing = await ctx.db.query("moderationReports")
      .withIndex("by_reporter_challenge", q => q.eq("reporterId", reporterId).eq("challengeId", args.challengeId)).first();
    if (existing) return {success: true};
    const recent = await ctx.db.query("moderationReports")
      .withIndex("by_reporter_created", q => q.eq("reporterId", reporterId).gte("createdAt", Date.now() - 86400000)).take(20);
    if (recent.length >= 20) throw new Error("Report limit reached. Please contact support.");
    await ctx.db.insert("moderationReports", { ...args, reporterId, status: "pending", createdAt: Date.now() });
    await ctx.db.patch(args.challengeId, {isPublic: false, moderationStatus: "pending"});
    return {success: true};
  },
});

export const block = mutation({
  args: {blockedUserId: v.string()},
  handler: async (ctx, args) => {
    const userId = await signedIn(ctx);
    if (userId === args.blockedUserId || !args.blockedUserId.trim() || args.blockedUserId.length > 128) throw new Error("Invalid account");
    const existing = await ctx.db.query("userBlocks")
      .withIndex("by_user_blocked", q => q.eq("userId", userId).eq("blockedUserId", args.blockedUserId)).first();
    const total = await ctx.db.query("userBlocks").withIndex("by_user_blocked", q => q.eq("userId", userId)).take(1000);
    if (!existing && total.length >= 1000) throw new Error("Block limit reached. Please contact support.");
    if (!existing) await ctx.db.insert("userBlocks", {userId, blockedUserId: args.blockedUserId, createdAt: Date.now()});
    return {success: true};
  },
});

export const unblock = mutation({
  args: {id: v.id("userBlocks")},
  handler: async (ctx, args) => {
    const userId = await signedIn(ctx);
    const block = await ctx.db.get(args.id);
    if (!block || block.userId !== userId) throw new Error("Not authorized");
    await ctx.db.delete(args.id);
    return {success: true};
  },
});

export const blocks = query({
  args: {},
  handler: async ctx => {
    const userId = await signedIn(ctx);
    return ctx.db.query("userBlocks").withIndex("by_user_blocked", q => q.eq("userId", userId)).collect();
  },
});

export const queue = query({
  args: {},
  handler: async ctx => {
    await moderator(ctx);
    const reports = await ctx.db.query("moderationReports").withIndex("by_status_created", q => q.eq("status", "pending")).order("asc").take(100);
    return Promise.all(reports.map(async report => {
      const challenge = await ctx.db.get(report.challengeId);
      return {...report, challengeName: challenge?.name ?? "Deleted goal"};
    }));
  },
});

/** Review never republishes content; a later community release needs a separate gate. */
export const resolve = mutation({
  args: {id: v.id("moderationReports"), decision: v.union(v.literal("removed"), v.literal("dismissed")), note: v.string()},
  handler: async (ctx, args) => {
    const reviewedBy = await moderator(ctx);
    if (!args.note.trim() || args.note.length > 1000) throw new Error("A review note of up to 1,000 characters is required");
    const report = await ctx.db.get(args.id);
    if (!report) throw new Error("Report not found");
    if (report.status !== "pending") return {success: true};
    const challenge = await ctx.db.get(report.challengeId);
    if (challenge) await ctx.db.patch(challenge._id, {isPublic: false, moderationStatus: args.decision === "removed" ? "removed" : "reviewed"});
    await ctx.db.patch(args.id, {status: args.decision, reviewNote: args.note.trim(), reviewedBy, reviewedAt: Date.now()});
    return {success: true};
  },
});
