import { jsonOk } from "../../_lib/response";
import { listPublicChallenges } from "../../_lib/store";
import { withApiTrace } from "../../_lib/telemetry";

export async function GET(request: Request) {
  return withApiTrace(request, "api.v1.public.challenges.list", async () => {
    const challenges = listPublicChallenges();
    return jsonOk(challenges);
  });
}
