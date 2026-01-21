/**
 * POST /api/v1/follow - Follow a challenge
 * DELETE /api/v1/follow - Unfollow a challenge
 */
import { requireAuth, isAuthError } from "../_lib/auth";
import {
  getChallengeById,
  isFollowing,
  createFollow,
  deleteFollow,
} from "../_lib/store";
import {
  jsonOk,
  jsonCreated,
  jsonBadRequest,
  jsonForbidden,
  jsonNotFound,
  jsonInternalError,
} from "../_lib/response";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const body = await request.json();

    if (!body.challengeId || typeof body.challengeId !== "string") {
      return jsonBadRequest("challengeId is required");
    }

    const challenge = await getChallengeById(body.challengeId);
    if (!challenge) {
      return jsonNotFound("Challenge not found");
    }

    if (!challenge.isPublic) {
      return jsonForbidden("Cannot follow private challenges");
    }

    // Can't follow your own challenge
    if (challenge.userId === authResult.userId) {
      return jsonBadRequest("Cannot follow your own challenge");
    }

    // Check if already following
    if (await isFollowing(authResult.userId, body.challengeId)) {
      return jsonOk({ success: true, message: "Already following" });
    }

    await createFollow(authResult.userId, body.challengeId);

    return jsonCreated({ success: true });
  } catch (error) {
    console.error("Error in POST /api/v1/follow:", error);
    return jsonInternalError();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const body = await request.json();

    if (!body.challengeId || typeof body.challengeId !== "string") {
      return jsonBadRequest("challengeId is required");
    }

    const deleted = await deleteFollow(authResult.userId, body.challengeId);

    return jsonOk({ success: true, removed: deleted });
  } catch (error) {
    console.error("Error in DELETE /api/v1/follow:", error);
    return jsonInternalError();
  }
}
