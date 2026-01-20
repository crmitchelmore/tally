/**
 * GET /api/v1/challenges - List user's challenges
 * POST /api/v1/challenges - Create a new challenge
 */
import { requireAuth, isAuthError } from "../_lib/auth";
import {
  getActiveChallenges,
  getChallengesByUserId,
  createChallenge,
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

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    const challenges = includeArchived
      ? getChallengesByUserId(authResult.userId)
      : getActiveChallenges(authResult.userId);

    return jsonOk({ challenges });
  } catch (error) {
    console.error("Error in GET /api/v1/challenges:", error);
    return jsonInternalError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) {
      return authResult.response;
    }

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

    const challenge = createChallenge(authResult.userId, {
      name: body.name.trim(),
      target: body.target,
      timeframeType: body.timeframeType as TimeframeType,
      startDate,
      endDate,
      color: body.color || "#FF4747", // Default tally red
      icon: body.icon || "tally",
      isPublic: body.isPublic ?? false,
    });

    return jsonCreated({ challenge });
  } catch (error) {
    console.error("Error in POST /api/v1/challenges:", error);
    return jsonInternalError();
  }
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
