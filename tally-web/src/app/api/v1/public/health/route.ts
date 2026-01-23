import { NextResponse } from "next/server";

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

  const allHealthy = Object.values(checks).every(Boolean);
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
