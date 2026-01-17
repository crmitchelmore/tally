import { auth, currentUser } from "@clerk/nextjs/server";
import { jsonError, jsonOk } from "../../_lib/response";
import { getUser, registerUser } from "../../_lib/store";
import { withApiTrace } from "../../_lib/telemetry";

const users = new Map<string, { userId: string; clerkId: string }>();

export async function POST(request: Request) {
  return withApiTrace(request, "api.v1.auth.user", async () => {
    const { userId } = await auth();

    if (!userId) {
      return jsonError("Unauthorized", 401);
    }

    const clerkUser = await currentUser();
    if (clerkUser && !getUser(userId)) {
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
    const existing = users.get(userId);
    if (existing) {
      return jsonOk(existing, 200);
    }
    const record = { userId, clerkId: userId };
    users.set(userId, record);
    return jsonOk(record, 200);
  });
}
