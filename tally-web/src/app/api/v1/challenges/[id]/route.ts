/**
 * GET /api/v1/challenges/[id] - Get challenge by ID
 * PATCH /api/v1/challenges/[id] - Update challenge
 * DELETE /api/v1/challenges/[id] - Delete challenge
 */
import { requireAuth, isAuthError } from "../../_lib/auth";
import {
  getChallengeById,
  updateChallenge,
  deleteChallenge,
} from "../../_lib/store";
import {
  jsonOk,
  jsonBadRequest,
  jsonForbidden,
  jsonNotFound,
  jsonInternalError,
} from "../../_lib/response";
import { validateUpdateChallenge } from "../../_lib/validate";
import type { NextRequest } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const { id } = await params;
    const challenge = await getChallengeById(id);

    if (!challenge) {
      return jsonNotFound("Challenge not found");
    }

    // Check ownership or public access
    if (challenge.userId !== authResult.userId && !challenge.isPublic) {
      return jsonForbidden("Access denied");
    }

    return jsonOk({ challenge });
  } catch (error) {
    console.error("Error in GET /api/v1/challenges/[id]:", error);
    return jsonInternalError();
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const { id } = await params;
    const challenge = await getChallengeById(id);

    if (!challenge) {
      return jsonNotFound("Challenge not found");
    }

    // Only owner can update
    if (challenge.userId !== authResult.userId) {
      return jsonForbidden("Access denied");
    }

    const body = await request.json();
    const validation = validateUpdateChallenge(body);

    if (!validation.valid) {
      return jsonBadRequest("Validation failed", validation.errors);
    }

    // Apply updates
    if (body.name !== undefined) challenge.name = body.name.trim();
    if (body.target !== undefined) challenge.target = body.target;
    if (body.color !== undefined) challenge.color = body.color;
    if (body.icon !== undefined) challenge.icon = body.icon;
    if (body.isPublic !== undefined) challenge.isPublic = body.isPublic;
    if (body.isArchived !== undefined) challenge.isArchived = body.isArchived;
    if (body.countType !== undefined) challenge.countType = body.countType;
    if (body.unitLabel !== undefined) challenge.unitLabel = body.unitLabel;
    if (body.defaultIncrement !== undefined) challenge.defaultIncrement = body.defaultIncrement;

    const updated = await updateChallenge(challenge);

    return jsonOk({ challenge: updated });
  } catch (error) {
    console.error("Error in PATCH /api/v1/challenges/[id]:", error);
    return jsonInternalError();
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const { id } = await params;
    const challenge = await getChallengeById(id);

    if (!challenge) {
      return jsonNotFound("Challenge not found");
    }

    // Only owner can delete
    if (challenge.userId !== authResult.userId) {
      return jsonForbidden("Access denied");
    }

    const result = await deleteChallenge(id);

    // Return deletedAt for undo capability
    return jsonOk({ success: true, id, deletedAt: result.deletedAt });
  } catch (error) {
    console.error("Error in DELETE /api/v1/challenges/[id]:", error);
    return jsonInternalError();
  }
}
