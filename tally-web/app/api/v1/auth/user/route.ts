import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const users = new Map<string, { userId: string; clerkId: string }>();

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = users.get(userId);
  if (existing) {
    return NextResponse.json(existing, { status: 200 });
  }

  const record = { userId, clerkId: userId };
  users.set(userId, record);
  return NextResponse.json(record, { status: 200 });
}
