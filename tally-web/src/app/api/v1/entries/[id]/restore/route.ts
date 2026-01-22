/**
 * POST /api/v1/entries/[id]/restore - Restore a soft-deleted entry
 */
import { requireAuth, isAuthError } from "../../../_lib/auth";
import { restoreEntry } from "../../../_lib/store";
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
      const entry = await restoreEntry(id, authResult.userId);
      return jsonOk({ success: true, entry });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("Access denied")) {
          return jsonForbidden("Access denied");
        }
        if (err.message.includes("not found")) {
          return jsonNotFound("Entry not found or already active");
        }
      }
      throw err;
    }
  } catch (error) {
    console.error("Error in POST /api/v1/entries/[id]/restore:", error);
    return jsonInternalError();
  }
}
