import { Id } from "./_generated/dataModel";
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Helper to parse Bearer token
function getClerkId(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  // In production, verify JWT with Clerk. For now, trust the clerkId passed as Bearer token.
  // TODO: Implement proper JWT verification with Clerk public keys
  return authHeader.slice(7);
}

// CORS headers for mobile clients
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// OPTIONS handler for CORS preflight
http.route({
  path: "/api/v1/challenges",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

// GET /api/v1/challenges - List active challenges
http.route({
  path: "/api/v1/challenges",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const clerkId = getClerkId(request);
    if (!clerkId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const challenges = await ctx.runQuery(api.challenges.listActive, { clerkId });
      return new Response(JSON.stringify({ data: challenges }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Failed to fetch challenges" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

// POST /api/v1/challenges - Create a challenge
http.route({
  path: "/api/v1/challenges",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const clerkId = getClerkId(request);
    if (!clerkId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const body = await request.json();
      const challengeId = await ctx.runMutation(api.challenges.create, {
        clerkId,
        ...body,
      });
      return new Response(JSON.stringify({ data: { id: challengeId } }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Failed to create challenge" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

// GET /api/v1/entries - List entries by challenge
http.route({
  path: "/api/v1/entries",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const clerkId = getClerkId(request);
    if (!clerkId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const challengeId = url.searchParams.get("challengeId");
    if (!challengeId) {
      return new Response(JSON.stringify({ error: "challengeId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const entries = await ctx.runQuery(api.entries.listByChallenge, {
        clerkId,
        challengeId: challengeId as Id<"challenges">,
      });
      return new Response(JSON.stringify({ data: entries }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Failed to fetch entries" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

// OPTIONS handler for entries
http.route({
  path: "/api/v1/entries",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

// POST /api/v1/entries - Create an entry
http.route({
  path: "/api/v1/entries",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const clerkId = getClerkId(request);
    if (!clerkId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const body = await request.json();
      const entryId = await ctx.runMutation(api.entries.create, {
        clerkId,
        ...body,
      });
      return new Response(JSON.stringify({ data: { id: entryId } }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Failed to create entry" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

// GET /api/v1/public-challenges - List public challenges
http.route({
  path: "/api/v1/public-challenges",
  method: "GET",
  handler: httpAction(async (ctx) => {
    try {
      const challenges = await ctx.runQuery(api.challenges.listPublic, {});
      return new Response(JSON.stringify({ data: challenges }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Failed to fetch challenges" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

// OPTIONS handler for public-challenges
http.route({
  path: "/api/v1/public-challenges",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

// GET /api/v1/leaderboard - Get leaderboard
http.route({
  path: "/api/v1/leaderboard",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const timeRange = (url.searchParams.get("timeRange") || "month") as "week" | "month" | "year" | "all";
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    try {
      const leaderboard = await ctx.runQuery(api.leaderboard.getLeaderboard, {
        timeRange,
        limit,
      });
      return new Response(JSON.stringify({ data: leaderboard }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Failed to fetch leaderboard" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

// OPTIONS handler for leaderboard
http.route({
  path: "/api/v1/leaderboard",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

// POST /api/v1/auth/user - Create/get user (called after Clerk auth)
http.route({
  path: "/api/v1/auth/user",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const clerkId = getClerkId(request);
    if (!clerkId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const body = await request.json();
      const user = await ctx.runMutation(api.users.getOrCreate, {
        clerkId,
        email: body.email,
        name: body.name,
        avatarUrl: body.avatarUrl,
      });
      return new Response(JSON.stringify({ data: user }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Failed to create user" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

// OPTIONS handler for auth
http.route({
  path: "/api/v1/auth/user",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

export default http;
