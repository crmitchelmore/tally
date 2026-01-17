import { currentUser } from "@clerk/nextjs/server";
import { jsonError, jsonOk } from "../../_lib/response";
import { requireUserId } from "../../_lib/auth";
import { deleteChallenge, getUser, registerUser, updateChallenge } from "../../_lib/store";
import { validateChallengePayload } from "../../_lib/validate";
import { jsonOkWithTelemetry, withApiTrace } from "../../_lib/telemetry";

async function ensureUserProfile(userId: string) {
  if (getUser(userId)) return;
  const clerkUser = await currentUser();
  if (!clerkUser) return;
  registerUser(userId, {
    id: userId,
    email: clerkUser.primaryEmailAddress?.emailAddress,
    name:
      clerkUser.fullName ||
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
      undefined,
    avatarUrl: clerkUser.imageUrl,
  });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return withApiTrace(request, "api.v1.challenges.update", async () => {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    await ensureUserProfile(userId);
    const payload = (await request.json()) as Record<string, unknown>;
    const { errors, value } = validateChallengePayload(payload);
    if (errors.length) return jsonError(errors.join(", "), 400);
    const updated = updateChallenge(userId, params.id, value);
    if (!updated) return jsonError("Not found", 404);
    const event = updated.archived ? "challenge_archived" : "challenge_updated";
    return jsonOkWithTelemetry(request, updated, {
      userId,
      event,
      properties: {
        challenge_id: updated.id,
        timeframe_unit: updated.timeframeUnit,
        target_number: updated.targetNumber,
        archived: updated.archived,
      },
    });
  });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return withApiTrace(request, "api.v1.challenges.delete", async () => {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    const removed = deleteChallenge(userId, params.id);
    if (!removed) return jsonError("Not found", 404);
    return jsonOkWithTelemetry(request, { id: params.id }, {
      userId,
      event: "challenge_archived",
      properties: {
        challenge_id: params.id,
        timeframe_unit: removed.timeframeUnit,
        target_number: removed.targetNumber,
        archived: true,
      },
    });
  });
}
