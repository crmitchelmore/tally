/**
 * GET /api/v1/data - Export user data
 * POST /api/v1/data - Import user data (replace-all)
 * DELETE /api/v1/data - Clear all user data
 */
import { requireAuth, isAuthError } from "../_lib/auth";
import {
  exportUserData,
  importUserData,
  clearUserData,
  getUserByClerkId,
} from "../_lib/store";
import {
  jsonOk,
  jsonBadRequest,
  jsonInternalError,
} from "../_lib/response";
import { validateImportData } from "../_lib/validate";
import type { NextRequest } from "next/server";
import {
  captureEvent,
  withSpan,
  generateRequestId,
} from "@/lib/telemetry";

// GET /api/v1/data - Export all user data
export async function GET() {
  const requestId = generateRequestId();

  return withSpan("data.export", { request_id: requestId }, async (span) => {
    try {
      const authResult = await requireAuth();
      if (isAuthError(authResult)) {
        return authResult.response;
      }

      const user = getUserByClerkId(authResult.userId);
      const userId = user?.id || authResult.userId;
      span.setAttribute("user.id", userId);

      // Capture export started
      await captureEvent("data_export_started", { userId, requestId });

      const data = exportUserData(authResult.userId);

      span.setAttribute("export.challenges_count", data.challenges.length);
      span.setAttribute("export.entries_count", data.entries.length);

      // Capture export completed
      await captureEvent("data_export_completed", { userId, requestId });

      return jsonOk(data);
    } catch (error) {
      console.error("Error in GET /api/v1/data:", error);
      return jsonInternalError();
    }
  });
}

// POST /api/v1/data - Import data (replace-all semantics)
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  return withSpan("data.import", { request_id: requestId }, async (span) => {
    try {
      const authResult = await requireAuth();
      if (isAuthError(authResult)) {
        return authResult.response;
      }

      const user = getUserByClerkId(authResult.userId);
      const userId = user?.id || authResult.userId;
      span.setAttribute("user.id", userId);

      const body = await request.json();
      const validation = validateImportData(body);

      if (!validation.valid) {
        return jsonBadRequest("Invalid import data", validation.errors);
      }

      // Capture import started
      await captureEvent("data_import_started", { userId, requestId });

      const result = importUserData(authResult.userId, body);

      span.setAttribute("import.challenges_count", result.challenges);
      span.setAttribute("import.entries_count", result.entries);

      // Capture import completed
      await captureEvent("data_import_completed", { userId, requestId });

      return jsonOk({
        success: true,
        imported: result,
      });
    } catch (error) {
      console.error("Error in POST /api/v1/data:", error);
      return jsonInternalError();
    }
  });
}

// DELETE /api/v1/data - Clear all user data
export async function DELETE() {
  const requestId = generateRequestId();

  return withSpan("data.clear", { request_id: requestId }, async (span) => {
    try {
      const authResult = await requireAuth();
      if (isAuthError(authResult)) {
        return authResult.response;
      }

      const user = getUserByClerkId(authResult.userId);
      const userId = user?.id || authResult.userId;
      span.setAttribute("user.id", userId);

      const result = clearUserData(authResult.userId);

      span.setAttribute("deleted.challenges_count", result.challenges);
      span.setAttribute("deleted.entries_count", result.entries);
      span.setAttribute("deleted.follows_count", result.follows);

      return jsonOk({
        success: true,
        deleted: result,
      });
    } catch (error) {
      console.error("Error in DELETE /api/v1/data:", error);
      return jsonInternalError();
    }
  });
}
