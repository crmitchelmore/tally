import { jsonError, jsonOk } from "../../_lib/response";
import { requireUserId } from "../../_lib/auth";
import { deleteEntry, updateEntry } from "../../_lib/store";
import { validateEntryPayload } from "../../_lib/validate";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  if (!userId) return jsonError("Unauthorized", 401);
  const payload = (await request.json()) as Record<string, unknown>;
  const { errors, value } = validateEntryPayload(payload);
  if (errors.length) return jsonError(errors.join(", "), 400);
  const updated = updateEntry(userId, params.id, value);
  if (!updated) return jsonError("Not found", 404);
  return jsonOk(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  if (!userId) return jsonError("Unauthorized", 401);
  const removed = deleteEntry(userId, params.id);
  if (!removed) return jsonError("Not found", 404);
  return jsonOk({ id: params.id });
}
