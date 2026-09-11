import { NextResponse } from "next/server";
import { requireAuth, isAuthError } from "../_lib/auth";
import { authenticatedClient } from "../_lib/convex-server";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export async function GET() {
  const identity = await requireAuth();
  if (isAuthError(identity)) return identity.response;
  try {
    const reports = await (await authenticatedClient()).query(api.moderation.queue, {});
    return NextResponse.json({reports}, {headers: {"Cache-Control": "no-store"}});
  } catch {
    return NextResponse.json({error: "Moderator access is required."}, {status: 403});
  }
}

export async function POST(request: Request) {
  const identity = await requireAuth();
  if (isAuthError(identity)) return identity.response;
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({error: "Invalid origin"}, {status: 403});
  try {
    const body = await request.json();
    const convex = await authenticatedClient();
    if (body.action === "resolve") {
      if (typeof body.id !== "string" || !["removed", "dismissed"].includes(body.decision) || typeof body.note !== "string") {
        return NextResponse.json({error: "A valid decision and review note are required."}, {status: 400});
      }
      await convex.mutation(api.moderation.resolve, {id: body.id as Id<"moderationReports">, decision: body.decision, note: body.note});
    } else if (body.action === "report") {
      if (typeof body.challengeId !== "string" || !["abuse", "sexual", "violence", "spam", "other"].includes(body.reason) || (body.detail !== undefined && typeof body.detail !== "string")) {
        return NextResponse.json({error: "Choose a reason for your report."}, {status: 400});
      }
      await convex.mutation(api.moderation.report, {challengeId: body.challengeId as Id<"challenges">, reason: body.reason, detail: body.detail});
    } else if (body.action === "block" && typeof body.blockedUserId === "string") {
      await convex.mutation(api.moderation.block, {blockedUserId: body.blockedUserId});
    } else {
      return NextResponse.json({error: "Unknown action."}, {status: 400});
    }
    return NextResponse.json({success: true});
  } catch {
    return NextResponse.json({error: "We could not save that action. Check your access and try again, or contact support."}, {status: 400});
  }
}
