import { auth, currentUser } from "@clerk/nextjs/server";
import { jsonError, jsonOk } from "../../_lib/response";
import { registerUser } from "../../_lib/store";

const users = new Map<string, { userId: string; clerkId: string }>();

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return jsonError("Unauthorized", 401);
  }

  const existing = users.get(userId);
  if (existing) {
    return jsonOk(existing, 200);
  }

  const clerkUser = await currentUser();
  if (clerkUser) {
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
  const record = { userId, clerkId: userId };
  users.set(userId, record);
  return jsonOk(record, 200);
}
