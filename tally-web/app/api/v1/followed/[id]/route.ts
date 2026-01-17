import { jsonError, jsonOk } from "../../_lib/response";
import { requireUserId } from "../../_lib/auth";
import { deleteFollowed } from "../../_lib/store";
import { withApiTrace } from "../../_lib/telemetry";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return withApiTrace(request, "api.v1.followed.delete", async () => {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    const removed = deleteFollowed(userId, params.id);
    if (!removed) return jsonError("Not found", 404);
    return jsonOk({ id: params.id });
  });
}
