import { auth } from "@clerk/nextjs/server";

export async function requireUserId() {
  const { userId } = await auth();
  return userId ?? null;
}
