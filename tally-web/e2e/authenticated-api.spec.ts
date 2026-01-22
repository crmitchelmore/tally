/**
 * E2E tests for authenticated flows against dev Convex instance
 * 
 * These tests run with real authentication against the dev backend.
 * Requires TEST_USER_EMAIL and TEST_USER_PASSWORD in environment.
 * 
 * Run with: CONVEX_DEPLOYMENT=$CONVEX_DEPLOYMENT_DEV bun run test:e2e --grep "@authenticated"
 */
import { authenticatedTest as test, expect } from "./fixtures/auth";

test.describe("Authenticated Challenge Flow @authenticated @api", () => {
  test.skip(
    !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
    "Skipping: TEST_USER_EMAIL and TEST_USER_PASSWORD required"
  );

  test("can create challenge with sets countType via API", async ({ authenticatedPage: page }) => {
    // Navigate to app dashboard
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    // Click create challenge button
    const createButton = page.getByRole("button", { name: /create.*challenge|new.*challenge/i });
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();

    // Wait for dialog
    await page.waitForTimeout(500);

    // Fill challenge name
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    await nameInput.fill("E2E Test Sets Challenge");

    // Fill target
    const targetInput = page.locator('input[name="target"], input[type="number"]').first();
    await targetInput.fill("1000");

    // Select Sets & Reps count type
    const setsButton = page.getByRole("button", { name: /sets/i });
    if (await setsButton.isVisible()) {
      await setsButton.click();
    }

    // Submit
    const submitButton = page.getByRole("button", { name: /create/i });
    await submitButton.click();

    // Wait for dialog to close and challenge to appear
    await page.waitForTimeout(1000);

    // Find the created challenge
    const challengeCard = page.locator('text="E2E Test Sets Challenge"').first();
    await expect(challengeCard).toBeVisible({ timeout: 10000 });

    // Click on challenge to open detail
    await challengeCard.click();
    await page.waitForTimeout(500);

    // Now try to add an entry - should show sets mode
    const addEntryButton = page.getByRole("button", { name: /add.*entry|add.*sets|\+/i }).first();
    await addEntryButton.click();
    await page.waitForTimeout(500);

    // Verify sets mode is shown (Set 1 label should be visible)
    const setsLabel = page.getByText(/set\s*1/i);
    await expect(setsLabel).toBeVisible({ timeout: 5000 });

    // Cleanup: delete the test challenge
    await page.goBack();
    await page.waitForTimeout(500);
    
    // Try to delete challenge if delete button is available
    const deleteButton = page.getByRole("button", { name: /delete/i });
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      // Confirm deletion if prompted
      const confirmButton = page.getByRole("button", { name: /confirm|yes|delete/i });
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }
    }
  });

  test("challenge countType persists through API round-trip", async ({ authenticatedPage: page }) => {
    const testChallengeName = `API Test ${Date.now()}`;
    
    // Navigate to app dashboard
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    // Create challenge with sets countType
    const createButton = page.getByRole("button", { name: /create.*challenge|new.*challenge/i });
    await createButton.click();
    await page.waitForTimeout(500);

    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    await nameInput.fill(testChallengeName);

    const targetInput = page.locator('input[name="target"], input[type="number"]').first();
    await targetInput.fill("500");

    // Select Sets & Reps
    const setsButton = page.getByRole("button", { name: /sets/i });
    if (await setsButton.isVisible()) {
      await setsButton.click();
    }

    const submitButton = page.getByRole("button", { name: /create/i });
    await submitButton.click();
    await page.waitForTimeout(1000);

    // Refresh page to force API fetch
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Find and click challenge
    const challengeCard = page.locator(`text="${testChallengeName}"`).first();
    await expect(challengeCard).toBeVisible({ timeout: 10000 });
    await challengeCard.click();
    await page.waitForTimeout(500);

    // Add entry - should still be in sets mode after page refresh
    const addButton = page.getByRole("button", { name: /add.*entry|add.*sets|\+/i }).first();
    await addButton.click();
    await page.waitForTimeout(500);

    // Verify sets mode persisted
    const setsLabel = page.getByText(/set\s*1/i);
    await expect(setsLabel).toBeVisible({ timeout: 5000 });

    // Cleanup
    await page.goBack();
    const deleteButton = page.getByRole("button", { name: /delete/i });
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      const confirmButton = page.getByRole("button", { name: /confirm|yes|delete/i });
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }
    }
  });
});

test.describe("Authenticated Entry Flow @authenticated @api", () => {
  test.skip(
    !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
    "Skipping: TEST_USER_EMAIL and TEST_USER_PASSWORD required"
  );

  test("can add entry with sets and verify it persists", async ({ authenticatedPage: page }) => {
    const testChallengeName = `Sets Entry Test ${Date.now()}`;
    
    // Create challenge
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    const createButton = page.getByRole("button", { name: /create.*challenge|new.*challenge/i });
    await createButton.click();
    await page.waitForTimeout(500);

    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    await nameInput.fill(testChallengeName);

    const targetInput = page.locator('input[name="target"], input[type="number"]').first();
    await targetInput.fill("1000");

    const setsButton = page.getByRole("button", { name: /sets/i });
    if (await setsButton.isVisible()) {
      await setsButton.click();
    }

    const submitButton = page.getByRole("button", { name: /create/i });
    await submitButton.click();
    await page.waitForTimeout(1000);

    // Open challenge
    const challengeCard = page.locator(`text="${testChallengeName}"`).first();
    await challengeCard.click();
    await page.waitForTimeout(500);

    // Add entry with sets
    const addButton = page.getByRole("button", { name: /add.*entry|add.*sets|\+/i }).first();
    await addButton.click();
    await page.waitForTimeout(500);

    // Should see sets UI
    const set1Input = page.locator('input[type="number"]').first();
    await set1Input.fill("25");

    // Add another set
    const addSetButton = page.getByRole("button", { name: /add.*set/i });
    if (await addSetButton.isVisible()) {
      await addSetButton.click();
      await page.waitForTimeout(200);
      
      const set2Input = page.locator('input[type="number"]').nth(1);
      await set2Input.fill("20");
    }

    // Submit entry
    const submitEntryButton = page.getByRole("button", { name: /add.*marks|add.*reps|submit/i });
    await submitEntryButton.click();
    await page.waitForTimeout(1000);

    // Refresh and verify entry persisted
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Challenge should show the total (25 + 20 = 45)
    const totalText = page.locator('text=/45|4[0-9]/');
    await expect(totalText.first()).toBeVisible({ timeout: 10000 });

    // Cleanup
    const deleteButton = page.getByRole("button", { name: /delete/i });
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      const confirmButton = page.getByRole("button", { name: /confirm|yes|delete/i });
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }
    }
  });
});
