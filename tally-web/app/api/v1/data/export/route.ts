import { jsonError, jsonOk } from "../../_lib/response";
import { requireUserId } from "../../_lib/auth";
import { getExportData } from "../../_lib/store";
import { withApiTrace } from "../../_lib/telemetry";

export async function GET(request: Request) {
  return withApiTrace(request, "api.v1.data.export", async () => {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    return jsonOk(getExportData(userId));
  });
}
