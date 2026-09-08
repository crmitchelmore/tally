import { auth, clerkClient } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { requireAuth, isAuthError } from "../_lib/auth";

export async function DELETE(request: Request) {
  const identity = await requireAuth();
  if (isAuthError(identity)) return identity.response;
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  try {
    const bearer = (await headers()).get("authorization")?.replace(/^Bearer /, "");
    const token = bearer || await (await auth()).getToken();
    if (!token || !process.env.NEXT_PUBLIC_CONVEX_URL) throw new Error("Account service unavailable");
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
    convex.setAuth(token);
    // Delete data before revoking the account so a failed request can be retried.
    await convex.mutation(api.users.deleteOwnAccountData, {});
    await (await clerkClient()).users.deleteUser(identity.userId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "We could not finish deleting your account. Please try again or contact support." }, { status: 500 });
  }
}
