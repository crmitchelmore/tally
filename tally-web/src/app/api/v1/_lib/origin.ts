import { NextResponse } from "next/server";

/**
 * Reject state-changing browser requests sent from another origin, so a
 * signed-in user's session cookie can't be used cross-site. Native apps and
 * API clients don't send an Origin header, so they're unaffected.
 */
export function rejectCrossOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  return null;
}
