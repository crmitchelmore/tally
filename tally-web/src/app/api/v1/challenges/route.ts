/**
 * GET /api/v1/challenges - List user's challenges
 * POST /api/v1/challenges - Create a new challenge
 */
import { requireAuth, isAuthError } from "../_lib/auth";
import {
  getActiveChallenges,
  getChallengesByUserId,
  createChallenge,
  getUserByClerkId,
} from "../_lib/store";
import {
  jsonOk,
  jsonCreated,
  jsonBadRequest,
  jsonInternalError,
} from "../_lib/response";
import { validateCreateChallenge } from "../_lib/validate";
import type { TimeframeType } from "../_lib/types";
import type { NextRequest } from "next/server";
import {
  captureEvent,
  withSpan,
  generateRequestId,
} from "@/lib/telemetry";

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  return withSpan("challenges.list", { request_id: requestId }, async (span) => {
    try {
      const authResult = await requireAuth();
      if (isAuthError(authResult)) {
        return authResult.response;
      }

      const user = await getUserByClerkId(authResult.userId);
      span.setAttribute("user.id", user?.id || authResult.userId);

      const { searchParams } = new URL(request.url);
      const includeArchived = searchParams.get("includeArchived") === "true";
      span.setAttribute("include_archived", includeArchived);

      const challenges = includeArchived
        ? await getChallengesByUserId(authResult.userId)
        : await getActiveChallenges(authResult.userId);

      span.setAttribute("challenges.count", challenges.length);

      return jsonOk({ challenges });
    } catch (error) {
      console.error("Error in GET /api/v1/challenges:", error);
      return jsonInternalError();
    }
  });
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  return withSpan("challenges.create", { request_id: requestId }, async (span) => {
    try {
      const authResult = await requireAuth();
      if (isAuthError(authResult)) {
        return authResult.response;
      }

      const user = await getUserByClerkId(authResult.userId);
      const userId = user?.id || authResult.userId;
      span.setAttribute("user.id", userId);

      const body = await request.json();
      const validation = validateCreateChallenge(body);

      if (!validation.valid) {
        return jsonBadRequest("Validation failed", validation.errors);
      }

      // Calculate dates based on timeframe
      const { startDate, endDate } = calculateTimeframeDates(
        body.timeframeType as TimeframeType,
        body.startDate,
        body.endDate
      );

      const challenge = await createChallenge(authResult.userId, {
        name: body.name.trim(),
        target: body.target,
        timeframeType: body.timeframeType as TimeframeType,
        startDate,
        endDate,
        color: body.color || "#FF4747", // Default tally red
        icon: body.icon || "tally",
        isPublic: body.isPublic ?? false,
      });

      span.setAttribute("challenge.id", challenge.id);
      span.setAttribute("challenge.timeframe_type", challenge.timeframeType);
      span.setAttribute("challenge.target", challenge.target);

      // Capture challenge_created event
      await captureEvent(
        "challenge_created",
        { userId, requestId },
        {
          challenge_id: challenge.id,
          timeframe_unit: challenge.timeframeType,
          target_number: challenge.target,
        }
      );

      return jsonCreated({ challenge });
    } catch (error) {
      console.error("Error in POST /api/v1/challenges:", error);
      return jsonInternalError();
    }
  });
}

function calculateTimeframeDates(
  type: TimeframeType,
  customStart?: string,
  customEnd?: string
): { startDate: string; endDate: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (type) {
    case "year":
      return {
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
      };
    case "month":
      const lastDay = new Date(year, month + 1, 0).getDate();
      return {
        startDate: `${year}-${String(month + 1).padStart(2, "0")}-01`,
        endDate: `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`,
      };
    case "custom":
      return {
        startDate: customStart!,
        endDate: customEnd!,
      };
    default:
      return {
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
      };
  }
}
