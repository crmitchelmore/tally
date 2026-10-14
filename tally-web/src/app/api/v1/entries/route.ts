/**
 * GET /api/v1/entries - List entries for a challenge (or all)
 * POST /api/v1/entries - Create a new entry
 */
import { requireAuth, isAuthError } from "../_lib/auth";
import {
  getEntriesByChallenge,
  getEntriesByUser,
  getChallengeById,
  createEntry,
  getUserByClerkId,
} from "../_lib/store";
import {
  jsonOk,
  jsonCreated,
  jsonBadRequest,
  jsonForbidden,
  jsonNotFound,
  jsonInternalError,
} from "../_lib/response";
import { validateCreateEntry } from "../_lib/validate";
import type { NextRequest } from "next/server";
import {
  captureEvent,
  withSpan,
  generateRequestId,
} from "@/lib/telemetry";

import { apiKeyDigest, capabilityClient, capabilityError } from "../_lib/api-key";
import { api } from "../../../../../convex/_generated/api";

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  return withSpan("entries.list", { request_id: requestId }, async (span) => {
    try {
      const authResult = await requireAuth();
      if (isAuthError(authResult)) {
        return authResult.response;
      }

      const user = await getUserByClerkId(authResult.userId);
      span.setAttribute("user.id", user?.id || authResult.userId);

      const { searchParams } = new URL(request.url);
      const challengeId = searchParams.get("challengeId");
      const date = searchParams.get("date"); // Filter by specific date

      if (challengeId) {
        span.setAttribute("filter.challenge_id", challengeId);
      }
      if (date) {
        span.setAttribute("filter.date", date);
      }

      let entries;

      if (challengeId) {
        // Check challenge ownership
        const challenge = await getChallengeById(challengeId);
        if (!challenge) {
          return jsonNotFound("Challenge not found");
        }
        if (challenge.userId !== authResult.userId && !challenge.isPublic) {
          return jsonForbidden("Access denied");
        }
        entries = await getEntriesByChallenge(challengeId);
      } else {
        entries = await getEntriesByUser(authResult.userId);
      }

      // Filter by date if provided
      if (date) {
        entries = entries.filter((e) => e.date === date);
      }

      span.setAttribute("entries.count", entries.length);

      return jsonOk({ entries });
    } catch (error) {
      console.error("Error in GET /api/v1/entries:", error);
      return jsonInternalError("Internal server error", error);
    }
  });
}

export async function POST(request: NextRequest) {
  const digest = apiKeyDigest(request);
  if (digest !== null) {
    try {
      let body;
      try { body = await request.json(); } catch { return jsonBadRequest("Invalid JSON body"); }
      const validation = validateCreateEntry(body);
      if (!validation.valid) return jsonBadRequest("Validation failed",validation.errors);
      if (typeof body.externalEventId !== "string" || !body.externalEventId.trim() || body.externalEventId.length > 200) return jsonBadRequest("A stable externalEventId (1–200 characters) is required for API-key writes");
      const result = await capabilityClient().mutation(api.apiKeys.createEntry,{digest,entry:{challengeId:body.challengeId,date:body.date,count:body.count,note:body.note,feeling:body.feeling,sets:body.sets?.length ? body.sets : undefined,externalEventId:body.externalEventId,timeZone:body.timeZone}});
      const response = jsonOk(result,result.replayed ? 200 : 201);
      response.headers.set("Cache-Control", "no-store");
      return response;
    } catch (error) { return capabilityError(error); }
  }
  const requestId = generateRequestId();

  return withSpan("entries.create", { request_id: requestId }, async (span) => {
    try {
      const authResult = await requireAuth();
      if (isAuthError(authResult)) {
        return authResult.response;
      }

      const user = await getUserByClerkId(authResult.userId);
      const userId = user?.id || authResult.userId;
      span.setAttribute("user.id", userId);

      let body;
      try { body = await request.json(); } catch { return jsonBadRequest("Invalid JSON body"); }
      const validation = validateCreateEntry(body);

      if (!validation.valid) {
        return jsonBadRequest("Validation failed", validation.errors);
      }

      // Verify challenge exists and user owns it
      const challenge = await getChallengeById(body.challengeId);
      if (!challenge) {
        return jsonNotFound("Challenge not found");
      }
      if (challenge.userId !== authResult.userId) {
        return jsonForbidden("Cannot add entries to challenges you don't own");
      }

      const entry = await createEntry(authResult.userId, {
        challengeId: body.challengeId,
        date: body.date,
        count: body.count,
        note: body.note,
        feeling: body.feeling,
        sets: body.sets?.length ? body.sets : undefined,
        externalEventId: body.externalEventId,
      });

      span.setAttribute("entry.id", entry.id);
      span.setAttribute("entry.challenge_id", entry.challengeId);
      span.setAttribute("entry.count", entry.count);

      // Capture entry_created event
      await captureEvent(
        "entry_created",
        { userId, requestId },
        {
          challenge_id: entry.challengeId,
          entry_id: entry.id,
          entry_count: entry.count,
          has_note: !!entry.note,
          feeling: entry.feeling,
        }
      );

      return jsonCreated({ entry });
    } catch (error) {
      if (error instanceof Error && error.message.includes("EVENT_CONFLICT")) return jsonOk({error:"EVENT_CONFLICT"},409);
      console.error("Error in POST /api/v1/entries:", error);
      return jsonInternalError("Internal server error", error);
    }
  });
}
