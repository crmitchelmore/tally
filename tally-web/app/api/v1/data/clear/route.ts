import { jsonError, jsonOk } from "../../_lib/response";
import { requireUserId } from "../../_lib/auth";
import { clearAllData } from "../../_lib/store";

export async function POST() {
  const userId = await requireUserId();
  if (!userId) return jsonError("Unauthorized", 401);
  clearAllData(userId);
  return jsonOk({ ok: true });
}
