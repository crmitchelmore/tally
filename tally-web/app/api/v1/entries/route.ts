import { jsonError, jsonOk } from "../_lib/response";
import { requireUserId } from "../_lib/auth";
import { createEntry, listEntries } from "../_lib/store";
import { validateEntryPayload } from "../_lib/validate";

export async function GET(request: Request) {
  const userId = await requireUserId();
  if (!userId) return jsonError("Unauthorized", 401);
  const { searchParams } = new URL(request.url);
  const challengeId = searchParams.get("challengeId") ?? undefined;
  const date = searchParams.get("date") ?? undefined;
  return jsonOk(listEntries(userId, { challengeId, date }));
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return jsonError("Unauthorized", 401);
  const payload = (await request.json()) as Record<string, unknown>;
  const { errors, value } = validateEntryPayload(payload);
  if (errors.length) return jsonError(errors.join(", "), 400);
  return jsonOk(createEntry(userId, value), 201);
}
