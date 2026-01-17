import { jsonOk } from "../../_lib/response";
import { listPublicChallenges } from "../../_lib/store";

export async function GET() {
  return jsonOk(listPublicChallenges());
}
