/**
 * POST /api/v1/challenges/[id]/restore - Restore a soft-deleted challenge
 */
import { requireAuth, isAuthError } from "../../../_lib/auth";
import { restoreChallenge } from "../../../_lib/store";
import {
  jsonOk,
  jsonForbidden,
  jsonNotFound,
  jsonInternalError,
} from "../../../_lib/response";
import type { NextRequest } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const { id } = await params;

    try {
      const challenge = await restoreChallenge(id);

      // Verify ownership
      if (challenge.userId !== authResult.userId) {
        return jsonForbidden("Access denied");
      }

      return jsonOk({ success: true, challenge });
    } catch (err) {
      // Challenge not found or already restored
      if (err instanceof Error && err.message.includes("not found")) {
        return jsonNotFound("Challenge not found or already active");
      }
      throw err;
    }
  } catch (error) {
    console.error("Error in POST /api/v1/challenges/[id]/restore:", error);
    return jsonInternalError();
  }
}
