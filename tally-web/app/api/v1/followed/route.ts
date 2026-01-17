import { jsonError, jsonOk } from "../_lib/response";
import { requireUserId } from "../_lib/auth";
import { createFollowed, listFollowed } from "../_lib/store";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return jsonError("Unauthorized", 401);
  return jsonOk(listFollowed(userId));
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return jsonError("Unauthorized", 401);
  const payload = (await request.json()) as Record<string, unknown>;
  const challengeId = typeof payload.challengeId === "string" ? payload.challengeId : "";
  if (!challengeId) return jsonError("challengeId is required", 400);
  const created = createFollowed(userId, challengeId);
  if (!created) return jsonError("Challenge is not public", 400);
  return jsonOk(created, 201);
}
