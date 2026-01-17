import { clerkMiddleware } from "@clerk/nextjs/server";

export const runtime = "edge";

const handler = clerkMiddleware();

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
