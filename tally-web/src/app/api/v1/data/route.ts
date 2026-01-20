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
} from "../_lib/store";
import {
  jsonOk,
  jsonBadRequest,
  jsonInternalError,
} from "../_lib/response";
import { validateImportData } from "../_lib/validate";
import type { NextRequest } from "next/server";

// GET /api/v1/data - Export all user data
export async function GET() {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const data = exportUserData(authResult.userId);

    return jsonOk(data);
  } catch (error) {
    console.error("Error in GET /api/v1/data:", error);
    return jsonInternalError();
  }
}

// POST /api/v1/data - Import data (replace-all semantics)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const body = await request.json();
    const validation = validateImportData(body);

    if (!validation.valid) {
      return jsonBadRequest("Invalid import data", validation.errors);
    }

    const result = importUserData(authResult.userId, body);

    return jsonOk({
      success: true,
      imported: result,
    });
  } catch (error) {
    console.error("Error in POST /api/v1/data:", error);
    return jsonInternalError();
  }
}

// DELETE /api/v1/data - Clear all user data
export async function DELETE() {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const result = clearUserData(authResult.userId);

    return jsonOk({
      success: true,
      deleted: result,
    });
  } catch (error) {
    console.error("Error in DELETE /api/v1/data:", error);
    return jsonInternalError();
  }
}
