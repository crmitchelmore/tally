import { jsonError, jsonOk } from "../_lib/response";
import { requireUserId } from "../_lib/auth";
import { createEntry, listEntries } from "../_lib/store";
import { validateEntryPayload } from "../_lib/validate";
import { jsonOkWithTelemetry, withApiTrace } from "../_lib/telemetry";

export async function GET(request: Request) {
  return withApiTrace(request, "api.v1.entries.list", async () => {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get("challengeId") ?? undefined;
    const date = searchParams.get("date") ?? undefined;
    return jsonOk(listEntries(userId, { challengeId, date }));
  });
}

export async function POST(request: Request) {
  return withApiTrace(request, "api.v1.entries.create", async () => {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    const payload = (await request.json()) as Record<string, unknown>;
    const { errors, value } = validateEntryPayload(payload);
    if (errors.length) return jsonError(errors.join(", "), 400);
    const entry = createEntry(userId, value);
    return jsonOkWithTelemetry(request, entry, {
      status: 201,
      userId,
      event: "entry_created",
      properties: {
        entry_id: entry.id,
        challenge_id: entry.challengeId,
        entry_count: entry.count,
        has_note: Boolean(entry.note),
        has_sets: Boolean(entry.sets?.length),
        feeling: entry.feeling,
      },
    });
  });
}
