import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

/**
 * Health check endpoint for smoke tests and monitoring.
 * 
 * Returns:
 * - 200: Service is healthy and all dependencies are accessible
 * - 503: Service is unhealthy (missing config, etc.)
 */
export async function GET() {
  const checks: Record<string, boolean> = {
    // Check that required env vars are present
    clerk_secret_key: !!process.env.CLERK_SECRET_KEY,
    convex_url: !!process.env.NEXT_PUBLIC_CONVEX_URL,
  };

  // Try to actually connect to Convex
  let convexConnected = false;
  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    try {
      const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
      const { api } = await import("../../../../../../convex/_generated/api");
      // A simple query to verify connectivity - list public challenges (should return empty or data)
      await client.query(api.challenges.listPublic, {});
      convexConnected = true;
    } catch (err) {
      // Keep backend error details out of this unauthenticated response.
      console.error("[Health] Convex connectivity check failed:", err);
    }
  }
  checks.convex_connected = convexConnected;

  const allHealthy = checks.clerk_secret_key && checks.convex_url && convexConnected;
  const status = allHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "unhealthy",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
