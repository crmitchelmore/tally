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
      const entry = await restoreEntry(id);

      // Verify ownership
      if (entry.userId !== authResult.userId) {
        return jsonForbidden("Access denied");
      }

      return jsonOk({ success: true, entry });
    } catch (err) {
      // Entry not found or already restored
      if (err instanceof Error && err.message.includes("not found")) {
        return jsonNotFound("Entry not found or already active");
      }
      throw err;
    }
  } catch (error) {
    console.error("Error in POST /api/v1/entries/[id]/restore:", error);
    return jsonInternalError();
  }
}
