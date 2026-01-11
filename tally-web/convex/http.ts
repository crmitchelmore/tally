import { httpRouter } from "convex/server";
import type { ActionCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { httpAction } from "./_generated/server";
import { api, components } from "./_generated/api";
import { registerRoutes as registerLaunchDarklyRoutes } from "@convex-dev/launchdarkly";

const http = httpRouter();

// Register LaunchDarkly webhook routes for real-time flag sync
registerLaunchDarklyRoutes(components.launchdarkly, http);

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// =============================================================================
// DTO Adapters: Transform Convex `_id` to API `id`
// =============================================================================

function toDTO<T extends { _id: string }>(doc: T): Omit<T, "_id"> & { id: string } {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
}

function toDTOList<T extends { _id: string }>(docs: T[]): (Omit<T, "_id"> & { id: string })[] {
  return docs.map(toDTO);
}

function getPathId(request: Request, prefix: string) {
  const { pathname } = new URL(request.url);
  if (!pathname.startsWith(prefix)) return null;
  const id = pathname.slice(prefix.length);
  return id.length ? id : null;
}

async function requireUser(ctx: ActionCtx, request: Request): Promise<{
  clerkId: string;
  userId: Id<"users">;
} | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const clerkId = identity.subject;
  const body =
    request.method === "POST" || request.method === "PATCH"
      ? await request
          .clone()
          .json()
          .catch(() => ({} as Record<string, unknown>))
      : ({} as Record<string, unknown>);

  const existing = await ctx.runQuery(api.users.getByClerkId, { clerkId });
  const userId =
    existing?._id ??
    (await ctx.runMutation(api.users.getOrCreate, {
      clerkId,
      email: body.email as string | undefined,
      name: body.name as string | undefined,
      avatarUrl: body.avatarUrl as string | undefined,
    }));

  return { clerkId, userId };
}

// =============================================================================
// CORS Preflight (handles both /api/ and /api/v1/)
// =============================================================================

http.route({
  pathPrefix: "/api/",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders })),
});

// =============================================================================
// API v1 Routes (versioned - recommended for mobile clients)
// =============================================================================

http.route({
  path: "/api/v1/auth/user",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const user = await requireUser(ctx, request);
    if (!user) return json(401, { error: "Unauthorized" });
    return json(200, { userId: user.userId, clerkId: user.clerkId });
  }),
});

http.route({
  path: "/api/v1/challenges",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const user = await requireUser(ctx, request);
    if (!user) return json(401, { error: "Unauthorized" });

    const url = new URL(request.url);
    const activeOnly = url.searchParams.get("active") === "true";
    const challenges = activeOnly
      ? await ctx.runQuery(api.challenges.listActive, { userId: user.userId })
      : await ctx.runQuery(api.challenges.list, { userId: user.userId });

    return json(200, toDTOList(challenges as unknown as { _id: string }[]));
  }),
});

http.route({
  path: "/api/v1/challenges",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const user = await requireUser(ctx, request);
    if (!user) return json(401, { error: "Unauthorized" });

    const data = await request.json().catch(() => null);
    if (!data) return json(400, { error: "Invalid JSON" });

    const required = [
      "name",
      "targetNumber",
      "year",
      "color",
      "icon",
      "timeframeUnit",
    ];
    for (const field of required) {
      if (data[field] === undefined) return json(400, { error: `${field} is required` });
    }

    const id = await ctx.runMutation(api.challenges.create, {
      name: data.name,
      targetNumber: data.targetNumber,
      year: data.year,
      color: data.color,
      icon: data.icon,
      timeframeUnit: data.timeframeUnit,
      startDate: data.startDate,
      endDate: data.endDate,
      isPublic: data.isPublic ?? false,
    });

    return json(201, { id });
  }),
});

http.route({
  pathPrefix: "/api/v1/challenges/",
  method: "PATCH",
  handler: httpAction(async (ctx, request) => {
    const user = await requireUser(ctx, request);
    if (!user) return json(401, { error: "Unauthorized" });

    const id = getPathId(request, "/api/v1/challenges/");
    if (!id) return json(400, { error: "id is required" });

    const existing = await ctx.runQuery(api.challenges.get, { id: id as Id<"challenges"> });
    if (!existing) return json(404, { error: "Not found" });
    if (existing.userId !== user.userId) return json(403, { error: "Forbidden" });

    const data = await request.json().catch(() => null);
    if (!data) return json(400, { error: "Invalid JSON" });

    await ctx.runMutation(api.challenges.update, {
      id: id as Id<"challenges">,
      name: data.name,
      targetNumber: data.targetNumber,
      color: data.color,
      icon: data.icon,
      isPublic: data.isPublic,
      archived: data.archived,
    });

    return json(200, { success: true });
  }),
});

http.route({
  path: "/api/v1/entries",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const user = await requireUser(ctx, request);
    if (!user) return json(401, { error: "Unauthorized" });

    const url = new URL(request.url);
    const challengeId = url.searchParams.get("challengeId");
    const date = url.searchParams.get("date");

    if (challengeId) {
      const challenge = await ctx.runQuery(api.challenges.get, { id: challengeId as Id<"challenges"> });
      if (!challenge) return json(404, { error: "Challenge not found" });
      if (challenge.userId !== user.userId) return json(403, { error: "Forbidden" });

      const entries = await ctx.runQuery(api.entries.listByChallenge, {
        challengeId: challengeId as Id<"challenges">,
      });
      return json(200, toDTOList(entries as unknown as { _id: string }[]));
    }

    const entries = date
      ? await ctx.runQuery(api.entries.listByUserDate, { userId: user.userId, date })
      : await ctx.runQuery(api.entries.listByUser, { userId: user.userId });

    return json(200, toDTOList(entries as unknown as { _id: string }[]));
  }),
});

http.route({
  path: "/api/v1/entries",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const user = await requireUser(ctx, request);
    if (!user) return json(401, { error: "Unauthorized" });

    const data = await request.json().catch(() => null);
    if (!data) return json(400, { error: "Invalid JSON" });

    const required = ["challengeId", "date", "count"];
    for (const field of required) {
      if (data[field] === undefined) return json(400, { error: `${field} is required` });
    }

    const challenge = await ctx.runQuery(api.challenges.get, { id: data.challengeId as Id<"challenges"> });
    if (!challenge) return json(404, { error: "Challenge not found" });
    if (challenge.userId !== user.userId) return json(403, { error: "Forbidden" });

    const id = await ctx.runMutation(api.entries.create, {
      challengeId: data.challengeId,
      date: data.date,
      count: data.count,
      note: data.note,
      sets: data.sets,
      feeling: data.feeling,
    });

    return json(201, { id });
  }),
});

http.route({
  pathPrefix: "/api/v1/entries/",
  method: "PATCH",
  handler: httpAction(async (ctx, request) => {
    const user = await requireUser(ctx, request);
    if (!user) return json(401, { error: "Unauthorized" });

    const id = getPathId(request, "/api/v1/entries/");
    if (!id) return json(400, { error: "id is required" });

    const existing = await ctx.runQuery(api.entries.get, { id: id as Id<"entries"> });
    if (!existing) return json(404, { error: "Not found" });
    if (existing.userId !== user.userId) return json(403, { error: "Forbidden" });

    const data = await request.json().catch(() => null);
    if (!data) return json(400, { error: "Invalid JSON" });

    await ctx.runMutation(api.entries.update, {
      id: id as Id<"entries">,
      count: data.count,
      note: data.note,
      date: data.date,
      sets: data.sets,
      feeling: data.feeling,
    });

    return json(200, { success: true });
  }),
});

http.route({
  pathPrefix: "/api/v1/entries/",
  method: "DELETE",
  handler: httpAction(async (ctx, request) => {
    const user = await requireUser(ctx, request);
    if (!user) return json(401, { error: "Unauthorized" });

    const id = getPathId(request, "/api/v1/entries/");
    if (!id) return json(400, { error: "id is required" });

    const existing = await ctx.runQuery(api.entries.get, { id: id as Id<"entries"> });
    if (!existing) return json(404, { error: "Not found" });
    if (existing.userId !== user.userId) return json(403, { error: "Forbidden" });

    await ctx.runMutation(api.entries.remove, { id: id as Id<"entries"> });
    return json(200, { success: true });
  }),
});

http.route({
  path: "/api/v1/followed",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const user = await requireUser(ctx, request);
    if (!user) return json(401, { error: "Unauthorized" });

    const followed = await ctx.runQuery(api.followedChallenges.listByUser, {
      userId: user.userId,
    });
    return json(200, toDTOList(followed as unknown as { _id: string }[]));
  }),
});

http.route({
  path: "/api/v1/followed",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const user = await requireUser(ctx, request);
    if (!user) return json(401, { error: "Unauthorized" });

    const data = await request.json().catch(() => null);
    if (!data) return json(400, { error: "Invalid JSON" });
    if (!data.challengeId) return json(400, { error: "challengeId is required" });

    const id = await ctx.runMutation(api.followedChallenges.follow, {
      challengeId: data.challengeId,
    });
    return json(201, { id });
  }),
});

http.route({
  pathPrefix: "/api/v1/followed/",
  method: "DELETE",
  handler: httpAction(async (ctx, request) => {
    const user = await requireUser(ctx, request);
    if (!user) return json(401, { error: "Unauthorized" });

    const idOrChallengeId = getPathId(request, "/api/v1/followed/");
    if (!idOrChallengeId) return json(400, { error: "id is required" });

    // Accept either a challengeId or a followedChallenges document id.
    try {
      await ctx.runMutation(api.followedChallenges.unfollow, {
        challengeId: idOrChallengeId as unknown as Id<"challenges">,
      });
      return json(200, { success: true });
    } catch {
      // Fall through.
    }

    let follow: Doc<"followedChallenges"> | null = null;
    try {
      follow = await ctx.runQuery(api.followedChallenges.get, {
        id: idOrChallengeId as unknown as Id<"followedChallenges">,
      });
    } catch {
      follow = null;
    }

    if (!follow) return json(404, { error: "Not found" });
    if (follow.userId !== user.userId) return json(403, { error: "Forbidden" });

    await ctx.runMutation(api.followedChallenges.remove, {
      id: idOrChallengeId as unknown as Id<"followedChallenges">,
    });

    return json(200, { success: true });
  }),
});

http.route({
  path: "/api/v1/public/challenges",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const challenges = await ctx.runQuery(api.challenges.listPublic, {});
    return json(200, toDTOList(challenges as unknown as { _id: string }[]));
  }),
});

http.route({
  path: "/api/v1/leaderboard",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const challenges = await ctx.runQuery(api.challenges.listPublic, {});
    const withFollowers = await Promise.all(
      challenges.map(async (challenge: Doc<"challenges">) => {
        const followers = await ctx.runQuery(api.followedChallenges.getFollowerCount, {
          challengeId: challenge._id,
        });
        return { challenge: toDTO(challenge as unknown as { _id: string }), followers };
      })
    );

    withFollowers.sort((a, b) => b.followers - a.followers);
    return json(200, withFollowers);
  }),
});

// =============================================================================
// Legacy /api/ Routes (compatibility aliases - deprecated)
// These routes maintain backwards compatibility but return Convex _id format.
// New clients should use /api/v1/ routes.
// =============================================================================

http.route({
  path: "/api/auth/user",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const user = await requireUser(ctx, request);
    if (!user) return json(401, { error: "Unauthorized" });
    return json(200, { userId: user.userId, clerkId: user.clerkId });
  }),
});

http.route({
  path: "/api/challenges",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const user = await requireUser(ctx, request);
    if (!user) return json(401, { error: "Unauthorized" });

    const url = new URL(request.url);
    const activeOnly = url.searchParams.get("active") === "true";
    const challenges = activeOnly
      ? await ctx.runQuery(api.challenges.listActive, { userId: user.userId })
      : await ctx.runQuery(api.challenges.list, { userId: user.userId });

    return json(200, challenges);
  }),
});

http.route({
  path: "/api/challenges",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const user = await requireUser(ctx, request);
    if (!user) return json(401, { error: "Unauthorized" });

    const data = await request.json().catch(() => null);
    if (!data) return json(400, { error: "Invalid JSON" });

    const required = [
      "name",
      "targetNumber",
      "year",
      "color",
      "icon",
      "timeframeUnit",
    ];
    for (const field of required) {
      if (data[field] === undefined) return json(400, { error: `${field} is required` });
    }

    const id = await ctx.runMutation(api.challenges.create, {
      name: data.name,
      targetNumber: data.targetNumber,
      year: data.year,
      color: data.color,
      icon: data.icon,
      timeframeUnit: data.timeframeUnit,
      startDate: data.startDate,
      endDate: data.endDate,
      isPublic: data.isPublic ?? false,
    });

    return json(201, { id });
  }),
});

http.route({
  pathPrefix: "/api/challenges/",
  method: "PATCH",
  handler: httpAction(async (ctx, request) => {
    const user = await requireUser(ctx, request);
    if (!user) return json(401, { error: "Unauthorized" });

    const id = getPathId(request, "/api/challenges/");
    if (!id) return json(400, { error: "id is required" });

    const existing = await ctx.runQuery(api.challenges.get, { id: id as Id<"challenges"> });
    if (!existing) return json(404, { error: "Not found" });
    if (existing.userId !== user.userId) return json(403, { error: "Forbidden" });

    const data = await request.json().catch(() => null);
    if (!data) return json(400, { error: "Invalid JSON" });

    await ctx.runMutation(api.challenges.update, {
      id: id as Id<"challenges">,
      name: data.name,
      targetNumber: data.targetNumber,
      color: data.color,
      icon: data.icon,
      isPublic: data.isPublic,
      archived: data.archived,
    });

    return json(200, { success: true });
  }),
});

http.route({
  path: "/api/entries",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const user = await requireUser(ctx, request);
    if (!user) return json(401, { error: "Unauthorized" });

    const url = new URL(request.url);
    const challengeId = url.searchParams.get("challengeId");
    const date = url.searchParams.get("date");

    if (challengeId) {
      const challenge = await ctx.runQuery(api.challenges.get, { id: challengeId as Id<"challenges"> });
      if (!challenge) return json(404, { error: "Challenge not found" });
      if (challenge.userId !== user.userId) return json(403, { error: "Forbidden" });

      const entries = await ctx.runQuery(api.entries.listByChallenge, {
        challengeId: challengeId as Id<"challenges">,
      });
      return json(200, entries);
    }

    const entries = date
      ? await ctx.runQuery(api.entries.listByUserDate, { userId: user.userId, date })
      : await ctx.runQuery(api.entries.listByUser, { userId: user.userId });

    return json(200, entries);
  }),
});

http.route({
  path: "/api/entries",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const user = await requireUser(ctx, request);
    if (!user) return json(401, { error: "Unauthorized" });

    const data = await request.json().catch(() => null);
    if (!data) return json(400, { error: "Invalid JSON" });

    const required = ["challengeId", "date", "count"];
    for (const field of required) {
      if (data[field] === undefined) return json(400, { error: `${field} is required` });
    }

    const challenge = await ctx.runQuery(api.challenges.get, { id: data.challengeId as Id<"challenges"> });
    if (!challenge) return json(404, { error: "Challenge not found" });
    if (challenge.userId !== user.userId) return json(403, { error: "Forbidden" });

    const id = await ctx.runMutation(api.entries.create, {
      challengeId: data.challengeId,
      date: data.date,
      count: data.count,
      note: data.note,
      sets: data.sets,
      feeling: data.feeling,
    });

    return json(201, { id });
  }),
});

http.route({
  pathPrefix: "/api/entries/",
  method: "PATCH",
  handler: httpAction(async (ctx, request) => {
    const user = await requireUser(ctx, request);
    if (!user) return json(401, { error: "Unauthorized" });

    const id = getPathId(request, "/api/entries/");
    if (!id) return json(400, { error: "id is required" });

    const existing = await ctx.runQuery(api.entries.get, { id: id as Id<"entries"> });
    if (!existing) return json(404, { error: "Not found" });
    if (existing.userId !== user.userId) return json(403, { error: "Forbidden" });

    const data = await request.json().catch(() => null);
    if (!data) return json(400, { error: "Invalid JSON" });

    await ctx.runMutation(api.entries.update, {
      id: id as Id<"entries">,
      count: data.count,
      note: data.note,
      date: data.date,
      sets: data.sets,
      feeling: data.feeling,
    });

    return json(200, { success: true });
  }),
});

http.route({
  pathPrefix: "/api/entries/",
  method: "DELETE",
  handler: httpAction(async (ctx, request) => {
    const user = await requireUser(ctx, request);
    if (!user) return json(401, { error: "Unauthorized" });

    const id = getPathId(request, "/api/entries/");
    if (!id) return json(400, { error: "id is required" });

    const existing = await ctx.runQuery(api.entries.get, { id: id as Id<"entries"> });
    if (!existing) return json(404, { error: "Not found" });
    if (existing.userId !== user.userId) return json(403, { error: "Forbidden" });

    await ctx.runMutation(api.entries.remove, { id: id as Id<"entries"> });
    return json(200, { success: true });
  }),
});

http.route({
  path: "/api/followed",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const user = await requireUser(ctx, request);
    if (!user) return json(401, { error: "Unauthorized" });

    const followed = await ctx.runQuery(api.followedChallenges.listByUser, {
      userId: user.userId,
    });
    return json(200, followed);
  }),
});

http.route({
  path: "/api/followed",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const user = await requireUser(ctx, request);
    if (!user) return json(401, { error: "Unauthorized" });

    const data = await request.json().catch(() => null);
    if (!data) return json(400, { error: "Invalid JSON" });
    if (!data.challengeId) return json(400, { error: "challengeId is required" });

    const id = await ctx.runMutation(api.followedChallenges.follow, {
      challengeId: data.challengeId,
    });
    return json(201, { id });
  }),
});

http.route({
  pathPrefix: "/api/followed/",
  method: "DELETE",
  handler: httpAction(async (ctx, request) => {
    const user = await requireUser(ctx, request);
    if (!user) return json(401, { error: "Unauthorized" });

    const idOrChallengeId = getPathId(request, "/api/followed/");
    if (!idOrChallengeId) return json(400, { error: "id is required" });

    // Accept either a challengeId or a followedChallenges document id.
    try {
      await ctx.runMutation(api.followedChallenges.unfollow, {
        challengeId: idOrChallengeId as unknown as Id<"challenges">,
      });
      return json(200, { success: true });
    } catch {
      // Fall through.
    }

    let follow: Doc<"followedChallenges"> | null = null;
    try {
      follow = await ctx.runQuery(api.followedChallenges.get, {
        id: idOrChallengeId as unknown as Id<"followedChallenges">,
      });
    } catch {
      follow = null;
    }

    if (!follow) return json(404, { error: "Not found" });
    if (follow.userId !== user.userId) return json(403, { error: "Forbidden" });

    await ctx.runMutation(api.followedChallenges.remove, {
      id: idOrChallengeId as unknown as Id<"followedChallenges">,
    });

    return json(200, { success: true });
  }),
});

http.route({
  path: "/api/public/challenges",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const challenges = await ctx.runQuery(api.challenges.listPublic, {});
    return json(200, challenges);
  }),
});

http.route({
  path: "/api/leaderboard",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const challenges = await ctx.runQuery(api.challenges.listPublic, {});
    const withFollowers = await Promise.all(
      challenges.map(async (challenge: Doc<"challenges">) => {
        const followers = await ctx.runQuery(api.followedChallenges.getFollowerCount, {
          challengeId: challenge._id,
        });
        return { challenge, followers };
      })
    );

    withFollowers.sort((a, b) => b.followers - a.followers);
    return json(200, withFollowers);
  }),
});

export default http;
