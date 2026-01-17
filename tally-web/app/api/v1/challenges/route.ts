import { jsonError, jsonOk } from "../_lib/response";
import { requireUserId } from "../_lib/auth";
import { createChallenge, listChallenges } from "../_lib/store";
import { parseBoolean, validateChallengePayload } from "../_lib/validate";

export async function GET(request: Request) {
  const userId = await requireUserId();
  if (!userId) return jsonError("Unauthorized", 401);
  const { searchParams } = new URL(request.url);
  const active = parseBoolean(searchParams.get("active"));
  return jsonOk(listChallenges(userId, active));
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return jsonError("Unauthorized", 401);
  const payload = (await request.json()) as Record<string, unknown>;
  const { errors, value } = validateChallengePayload(payload);
  if (errors.length) return jsonError(errors.join(", "), 400);
  return jsonOk(createChallenge(userId, value), 201);
}
