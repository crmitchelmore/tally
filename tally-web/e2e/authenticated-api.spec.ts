/**
 * E2E tests for authenticated flows against dev Convex instance
 */
import { authenticatedTest as test, expect } from "./fixtures/auth";

test.describe("Authenticated Challenge Flow @authenticated @api", () => {
  test.skip(
    !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
    "Skipping: TEST_USER_EMAIL and TEST_USER_PASSWORD required"
  );

  test("can create challenge with sets countType via API", async ({ authenticatedPage: page }) => {
    // Generate unique challenge name for this test run
    const uniqueName = `Sets Test ${Date.now()}`;
    let createdChallengeId: string | null = null;

    // Capture created challenge ID from POST response
    page.on("response", async (response) => {
      if (response.url().includes("/api/v1/challenges") && response.request().method() === "POST") {
        const body = await response.json().catch(() => null);
        if (body?.challenge?.id) {
          createdChallengeId = body.challenge.id;
          console.log("Created challenge:", body.challenge.id, "countType:", body.challenge.countType);
        }
      }
    });

    // Navigate to app dashboard
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    // Click create challenge button
    const createButton = page.getByRole("button", { name: /create.*challenge|new.*challenge/i });
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();
    await page.waitForTimeout(500);

    // Fill challenge name with unique value
    const nameInput = page.locator('input[placeholder*="Push-ups" i], input[placeholder*="challenge" i]').first();
    await nameInput.fill(uniqueName);

    // Fill target
    const targetInput = page.locator('input[placeholder*="10000" i], input[type="number"]').first();
    await targetInput.fill("1000");

    // Select Sets & Reps count type
    const setsButton = page.getByRole("button", { name: /Sets & Reps/i });
    await setsButton.waitFor({ state: "visible", timeout: 5000 });
    await setsButton.click();
    await expect(setsButton).toHaveClass(/bg-accent/, { timeout: 2000 });

    // Submit
    const submitButton = page.getByLabel("New Challenge").getByRole("button", { name: /create challenge/i });
    await submitButton.click();
    
    // Wait for challenge to be created
    await page.waitForTimeout(2000);
    expect(createdChallengeId).toBeTruthy();

    // Navigate directly to the created challenge detail page
    await page.goto(`/app/challenges/${createdChallengeId}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Verify we're on the right challenge
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 5000 });

    // Now try to add an entry
    const addEntryButton = page.getByRole("button", { name: /add.*entry|add.*sets|\+/i }).first();
    await addEntryButton.click();
    await page.waitForTimeout(500);

    // Verify sets mode is shown (should see "Set 1" label)
    const setsLabel = page.getByText(/set\s*1/i);
    await expect(setsLabel).toBeVisible({ timeout: 5000 });
  });
});
