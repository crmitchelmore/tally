import { randomBytes, createHash } from "node:crypto";
import { ConvexHttpClient } from "convex/browser";
import { ConvexError } from "convex/values";
import { NextResponse } from "next/server";
export const KEY_PATTERN = /^tally_[a-f0-9]{64}$/;
export function generateKey() {
  const key = `tally_${randomBytes(32).toString("hex")}`;
  return {key, digest:digestKey(key), prefix:key.slice(0,14)};
}
export function digestKey(key: string) { return createHash("sha256").update(key).digest("hex"); }
export function apiKeyDigest(request: Request): string | null {
  const bearer = request.headers.get("authorization");
  if (!bearer?.startsWith("Bearer tally_")) return null;
  const key = bearer.slice(7);
  // Malformed API keys must not fall through to cookie or Clerk authentication.
  return KEY_PATTERN.test(key) ? digestKey(key) : "invalid";
}
export function capabilityClient() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) throw new Error("Convex configuration missing");
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
}
export function capabilityError(error: unknown) {
  const code = error instanceof ConvexError && typeof error.data === "object" && error.data ? (error.data as {code?:string}).code : undefined;
  const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : code === "NOT_FOUND" ? 404 : code === "EVENT_CONFLICT" ? 409 : code === "INVALID_INPUT" ? 400 : 500;
  // No exception logging: Convex errors can include submitted arguments.
  return NextResponse.json({error: status === 500 ? "Internal server error" : code}, {status, headers:{"Cache-Control":"no-store"}});
}
