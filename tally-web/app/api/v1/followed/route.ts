import { jsonError, jsonOk } from "../_lib/response";
import { requireUserId } from "../_lib/auth";
import { createFollowed, listFollowed } from "../_lib/store";
import { withApiTrace } from "../_lib/telemetry";

export async function GET(request: Request) {
  return withApiTrace(request, "api.v1.followed.list", async () => {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    return jsonOk(listFollowed(userId));
  });
}

export async function POST(request: Request) {
  return withApiTrace(request, "api.v1.followed.create", async () => {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    const payload = (await request.json()) as Record<string, unknown>;
    const challengeId = typeof payload.challengeId === "string" ? payload.challengeId : "";
    if (!challengeId) return jsonError("challengeId is required", 400);
    const created = createFollowed(userId, challengeId);
    if (!created) return jsonError("Challenge is not public", 400);
    return jsonOk(created, 201);
  });
}
