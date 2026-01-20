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

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  return withSpan("entries.list", { request_id: requestId }, async (span) => {
    try {
      const authResult = await requireAuth();
      if (isAuthError(authResult)) {
        return authResult.response;
      }

      const user = getUserByClerkId(authResult.userId);
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
        const challenge = getChallengeById(challengeId);
        if (!challenge) {
          return jsonNotFound("Challenge not found");
        }
        if (challenge.userId !== authResult.userId && !challenge.isPublic) {
          return jsonForbidden("Access denied");
        }
        entries = getEntriesByChallenge(challengeId);
      } else {
        entries = getEntriesByUser(authResult.userId);
      }

      // Filter by date if provided
      if (date) {
        entries = entries.filter((e) => e.date === date);
      }

      span.setAttribute("entries.count", entries.length);

      return jsonOk({ entries });
    } catch (error) {
      console.error("Error in GET /api/v1/entries:", error);
      return jsonInternalError();
    }
  });
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  return withSpan("entries.create", { request_id: requestId }, async (span) => {
    try {
      const authResult = await requireAuth();
      if (isAuthError(authResult)) {
        return authResult.response;
      }

      const user = getUserByClerkId(authResult.userId);
      const userId = user?.id || authResult.userId;
      span.setAttribute("user.id", userId);

      const body = await request.json();
      const validation = validateCreateEntry(body);

      if (!validation.valid) {
        return jsonBadRequest("Validation failed", validation.errors);
      }

      // Verify challenge exists and user owns it
      const challenge = getChallengeById(body.challengeId);
      if (!challenge) {
        return jsonNotFound("Challenge not found");
      }
      if (challenge.userId !== authResult.userId) {
        return jsonForbidden("Cannot add entries to challenges you don't own");
      }

      const entry = createEntry(authResult.userId, {
        challengeId: body.challengeId,
        date: body.date,
        count: body.count,
        note: body.note,
        feeling: body.feeling,
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
      console.error("Error in POST /api/v1/entries:", error);
      return jsonInternalError();
    }
  });
}
