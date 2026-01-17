import { jsonError, jsonOk } from "../../_lib/response";
import { requireUserId } from "../../_lib/auth";
import { deleteEntry, updateEntry } from "../../_lib/store";
import { validateEntryPayload } from "../../_lib/validate";
import { jsonOkWithTelemetry, withApiTrace } from "../../_lib/telemetry";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return withApiTrace(request, "api.v1.entries.update", async () => {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    const payload = (await request.json()) as Record<string, unknown>;
    const { errors, value } = validateEntryPayload(payload);
    if (errors.length) return jsonError(errors.join(", "), 400);
    const updated = updateEntry(userId, params.id, value);
    if (!updated) return jsonError("Not found", 404);
    return jsonOkWithTelemetry(request, updated, {
      userId,
      event: "entry_updated",
      properties: {
        entry_id: updated.id,
        challenge_id: updated.challengeId,
        entry_count: updated.count,
        has_note: Boolean(updated.note),
        has_sets: Boolean(updated.sets?.length),
        feeling: updated.feeling,
      },
    });
  });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return withApiTrace(request, "api.v1.entries.delete", async () => {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    const removed = deleteEntry(userId, params.id);
    if (!removed) return jsonError("Not found", 404);
    return jsonOkWithTelemetry(request, { id: params.id }, {
      userId,
      event: "entry_deleted",
      properties: {
        entry_id: params.id,
        challenge_id: removed.challengeId,
        entry_count: removed.count,
        has_note: Boolean(removed.note),
        has_sets: Boolean(removed.sets?.length),
        feeling: removed.feeling,
      },
    });
  });
}
