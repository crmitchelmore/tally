import { jsonError, jsonOk } from "../../_lib/response";
import { requireUserId } from "../../_lib/auth";
import { clearAllData } from "../../_lib/store";
import { withApiTrace } from "../../_lib/telemetry";

export async function POST(request: Request) {
  return withApiTrace(request, "api.v1.data.clear", async () => {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    clearAllData(userId);
    return jsonOk({ ok: true });
  });
}
