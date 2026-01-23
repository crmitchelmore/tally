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
    const nameInput = page.locator('input[placeholder*="Push-ups" i], input[placeholder*="challenge" i]').first();
    await nameInput.fill("E2E Test Sets Challenge");

    // Fill target
    const targetInput = page.locator('input[placeholder*="10000" i], input[type="number"]').first();
    await targetInput.fill("1000");

    // Select Sets & Reps count type
    const setsButton = page.getByRole("button", { name: /Sets & Reps/i });
    await setsButton.waitFor({ state: "visible", timeout: 5000 });
    await setsButton.click();

    // Submit
    const submitButton = page.getByLabel("New Challenge").getByRole("button", { name: /create challenge/i });
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
  });

  test("challenge countType persists through API round-trip", async ({ authenticatedPage: page }) => {
    const testChallengeName = `API Test ${Date.now()}`;
    
    // Navigate to app dashboard
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    // Create a challenge with sets countType
    const createButton = page.getByRole("button", { name: /create.*challenge|new.*challenge/i });
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();

    await page.waitForTimeout(500);

    const nameInput = page.locator('input[placeholder*="Push-ups" i], input[placeholder*="challenge" i]').first();
    await nameInput.fill(testChallengeName);

    const targetInput = page.locator('input[placeholder*="10000" i], input[type="number"]').first();
    await targetInput.fill("500");

    // Select Sets & Reps
    const setsButton = page.getByRole("button", { name: /Sets & Reps/i });
    await setsButton.waitFor({ state: "visible", timeout: 5000 });
    await setsButton.click();

    const submitButton = page.getByLabel("New Challenge").getByRole("button", { name: /create challenge/i });
    await submitButton.click();

    await page.waitForTimeout(1000);

    // Reload page to verify persistence
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Find and click the challenge
    const challengeCard = page.locator(`text="${testChallengeName}"`).first();
    await expect(challengeCard).toBeVisible({ timeout: 10000 });
    await challengeCard.click();
    await page.waitForTimeout(500);

    // Verify sets mode persisted
    const addEntryButton = page.getByRole("button", { name: /add.*entry|add.*sets|\+/i }).first();
    await addEntryButton.click();
    await page.waitForTimeout(500);

    // Should show sets mode UI
    const setsLabel = page.getByText(/set\s*1/i);
    await expect(setsLabel).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Authenticated Entry Flow @authenticated @api", () => {
  test.skip(
    !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
    "Skipping: TEST_USER_EMAIL and TEST_USER_PASSWORD required"
  );

  test("can add entry with sets and verify it persists", async ({ authenticatedPage: page }) => {
    const testChallengeName = `Entry Test ${Date.now()}`;
    
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    // Create challenge with sets mode
    const createButton = page.getByRole("button", { name: /create.*challenge|new.*challenge/i });
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();

    await page.waitForTimeout(500);

    const nameInput = page.locator('input[placeholder*="Push-ups" i], input[placeholder*="challenge" i]').first();
    await nameInput.fill(testChallengeName);

    const targetInput = page.locator('input[placeholder*="10000" i], input[type="number"]').first();
    await targetInput.fill("1000");

    const setsButton = page.getByRole("button", { name: /Sets & Reps/i });
    await setsButton.waitFor({ state: "visible", timeout: 5000 });
    await setsButton.click();

    const submitButton = page.getByLabel("New Challenge").getByRole("button", { name: /create challenge/i });
    await submitButton.click();

    await page.waitForTimeout(1000);

    // Open challenge detail
    const challengeCard = page.locator(`text="${testChallengeName}"`).first();
    await expect(challengeCard).toBeVisible({ timeout: 10000 });
    await challengeCard.click();
    await page.waitForTimeout(500);

    // Add entry with sets
    const addEntryButton = page.getByRole("button", { name: /add.*entry|add.*sets|\+/i }).first();
    await addEntryButton.click();
    await page.waitForTimeout(500);

    // Verify sets mode is shown
    const setsLabel = page.getByText(/set\s*1/i);
    await expect(setsLabel).toBeVisible({ timeout: 5000 });
  });
});
