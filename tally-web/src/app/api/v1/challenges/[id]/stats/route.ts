/**
 * GET /api/v1/challenges/[id]/stats - Get challenge stats
 */
import { requireAuth, isAuthError } from "../../../_lib/auth";
import { getChallengeById, calculateChallengeStats } from "../../../_lib/store";
import {
  jsonOk,
  jsonForbidden,
  jsonNotFound,
  jsonInternalError,
} from "../../../_lib/response";
import type { NextRequest } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const { id } = await params;
    const challenge = getChallengeById(id);

    if (!challenge) {
      return jsonNotFound("Challenge not found");
    }

    // Check ownership or public access
    if (challenge.userId !== authResult.userId && !challenge.isPublic) {
      return jsonForbidden("Access denied");
    }

    const stats = calculateChallengeStats(challenge);

    return jsonOk({ stats });
  } catch (error) {
    console.error("Error in GET /api/v1/challenges/[id]/stats:", error);
    return jsonInternalError();
  }
}
