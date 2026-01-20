import { NextResponse } from "next/server";

const clerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? process.env.CLERK_PUBLISHABLE_KEY;
const hasClerkEnv = !!clerkPublishableKey && !!process.env.CLERK_SECRET_KEY;

export const runtime = hasClerkEnv ? "edge" : "nodejs";

async function handler(request: Request) {
  if (!hasClerkEnv) {
    return NextResponse.json({ error: "Clerk not configured" }, { status: 503 });
  }
  const { clerkMiddleware } = await import("@clerk/nextjs/server");
  const nextHandler = clerkMiddleware();
  return nextHandler(request as any, { waitUntil: () => {} } as any);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
