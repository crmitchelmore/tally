/**
 * GET /api/v1/entries/[id] - Get entry by ID
 * PATCH /api/v1/entries/[id] - Update entry
 * DELETE /api/v1/entries/[id] - Delete entry
 */
import { requireAuth, isAuthError } from "../../_lib/auth";
import { getEntryById, updateEntry, deleteEntry } from "../../_lib/store";
import {
  jsonOk,
  jsonBadRequest,
  jsonForbidden,
  jsonNotFound,
  jsonInternalError,
} from "../../_lib/response";
import { validateUpdateEntry } from "../../_lib/validate";
import type { NextRequest } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const { id } = await params;
    const entry = await getEntryById(id);

    if (!entry) {
      return jsonNotFound("Entry not found");
    }

    // Only owner can view entries
    if (entry.userId !== authResult.userId) {
      return jsonForbidden("Access denied");
    }

    return jsonOk({ entry });
  } catch (error) {
    console.error("Error in GET /api/v1/entries/[id]:", error);
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
    const entry = await getEntryById(id);

    if (!entry) {
      return jsonNotFound("Entry not found");
    }

    // Only owner can update
    if (entry.userId !== authResult.userId) {
      return jsonForbidden("Access denied");
    }

    const body = await request.json();
    const validation = validateUpdateEntry(body);

    if (!validation.valid) {
      return jsonBadRequest("Validation failed", validation.errors);
    }

    // Apply updates
    if (body.date !== undefined) entry.date = body.date;
    if (body.count !== undefined) entry.count = body.count;
    if (body.sets !== undefined) entry.sets = body.sets?.length ? body.sets : undefined;
    if (body.note !== undefined) entry.note = body.note || undefined;
    if (body.feeling !== undefined) entry.feeling = body.feeling || undefined;

    const updated = await updateEntry(entry);

    return jsonOk({ entry: updated });
  } catch (error) {
    console.error("Error in PATCH /api/v1/entries/[id]:", error);
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
    const entry = await getEntryById(id);

    if (!entry) {
      return jsonNotFound("Entry not found");
    }

    // Only owner can delete
    if (entry.userId !== authResult.userId) {
      return jsonForbidden("Access denied");
    }

    const result = await deleteEntry(id);

    // Return deletedAt for undo capability
    return jsonOk({ success: true, id, deletedAt: result.deletedAt });
  } catch (error) {
    console.error("Error in DELETE /api/v1/entries/[id]:", error);
    return jsonInternalError();
  }
}
