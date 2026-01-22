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
      // Pass userId to restore - ownership validation happens in Convex mutation
      const challenge = await restoreChallenge(id, authResult.userId);
      return jsonOk({ success: true, challenge });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("Access denied")) {
          return jsonForbidden("Access denied");
        }
        if (err.message.includes("not found")) {
          return jsonNotFound("Challenge not found or already active");
        }
      }
      throw err;
    }
  } catch (error) {
    console.error("Error in POST /api/v1/challenges/[id]/restore:", error);
    return jsonInternalError();
  }
}
