/**
 * Regression test for challenge creation 500 error
 * 
 * Issue: Creating challenges with countType was returning 500 errors
 * because CLERK_SECRET_KEY wasn't being passed to Vercel runtime.
 */
import { test, expect } from "@playwright/test";

test.describe("Challenge Creation @challenges @regression", () => {
  test("can create challenge with countType via API (unauthenticated returns 401, not 500)", async ({ request }) => {
    // Without auth, we should get 401 Unauthorized, NOT 500 Internal Server Error
    // A 500 would indicate the server is misconfigured (e.g., missing CLERK_SECRET_KEY)
    const response = await request.post("/api/v1/challenges", {
      data: {
        name: "Regression Test",
        target: 1000,
        timeframeType: "year",
        color: "#FF4747",
        icon: "tally",
        isPublic: false,
        countType: "sets",
        unitLabel: "reps",
      },
    });

    // Should be 401 (unauthorized) not 500 (server error)
    expect(response.status()).not.toBe(500);
    expect(response.status()).toBe(401);
  });

  test("challenge create endpoint is healthy", async ({ request }) => {
    // Simple health check - the endpoint should respond, even if unauthorized
    const response = await request.post("/api/v1/challenges", {
      data: { invalid: "payload" },
    });

    // Any response other than 500/502/503 indicates the API is running correctly
    const status = response.status();
    expect(status).toBeLessThan(500);
  });
});
