import { currentUser } from "@clerk/nextjs/server";
import { jsonError, jsonOk } from "../_lib/response";
import { requireUserId } from "../_lib/auth";
import { createChallenge, getUser, listChallenges, registerUser } from "../_lib/store";
import { parseBoolean, validateChallengePayload } from "../_lib/validate";
import { jsonOkWithTelemetry, withApiTrace } from "../_lib/telemetry";

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

export async function GET(request: Request) {
  return withApiTrace(request, "api.v1.challenges.list", async () => {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    const { searchParams } = new URL(request.url);
    const active = parseBoolean(searchParams.get("active"));
    return jsonOk(listChallenges(userId, active));
  });
}

export async function POST(request: Request) {
  return withApiTrace(request, "api.v1.challenges.create", async () => {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    await ensureUserProfile(userId);
    const payload = (await request.json()) as Record<string, unknown>;
    const { errors, value } = validateChallengePayload(payload);
    if (errors.length) return jsonError(errors.join(", "), 400);
    const challenge = createChallenge(userId, value);
    return jsonOkWithTelemetry(request, challenge, {
      status: 201,
      userId,
      event: "challenge_created",
      properties: {
        challenge_id: challenge.id,
        timeframe_unit: challenge.timeframeUnit,
        target_number: challenge.targetNumber,
      },
    });
  });
}
