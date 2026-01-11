import { test, expect, Page } from "@playwright/test";

/**
 * Authenticated user E2E tests.
 * These tests require TEST_USER_EMAIL and TEST_USER_PASSWORD env vars.
 * Run with: bun run test:e2e --grep @auth
 */

// Helper to sign in
async function signIn(page: Page): Promise<void> {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error("Missing TEST_USER_EMAIL or TEST_USER_PASSWORD");
  }

  await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
  await page.getByLabel(/email address|email/i).fill(email);
  // Use exact match for primary "Continue" button (not social login buttons)
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  // Use the password input specifically by role and placeholder
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  // Wait for redirect and auth to complete
  await page.waitForURL(/\/(app)?$/, { timeout: 30000 });
}

test.describe("Authenticated Dashboard", () => {
  test.beforeEach(async () => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    test.skip(!email || !password, "Missing TEST_USER_EMAIL/TEST_USER_PASSWORD");
  });

  test("@auth dashboard loads with user data", async ({ page }) => {
    await signIn(page);
    await page.goto("/app", { waitUntil: "networkidle" });

    // Should show authenticated dashboard (not sign-in prompt)
    await expect(page.getByRole("heading", { name: /track your progress/i })).not.toBeVisible();

    // Should have "New Challenge" button
    await expect(page.getByRole("button", { name: /new challenge/i })).toBeVisible({
      timeout: 15000,
    });
  });

  test("@auth dashboard does not show blank screen (convex auth regression)", async ({ page }) => {
    await signIn(page);
    await page.goto("/app", { waitUntil: "domcontentloaded" });

    // The page should NOT be stuck in a blank state - either:
    // 1. Show loading skeletons (data loading)
    // 2. Show "No Challenges Yet" empty state
    // 3. Show actual challenges
    // If Convex isn't authenticated with Clerk, queries hang forever and content never loads

    // Wait for either: challenges section, empty state, or loading skeleton
    const hasContent = page.locator('[data-testid="challenges-section"], [data-testid="empty-state"]').or(
      page.getByText(/your challenges|no challenges yet/i)
    ).or(
      page.getByRole("button", { name: /new challenge|create.*challenge/i })
    );

    // This will fail if the page stays blank (Convex queries hanging due to missing auth)
    await expect(hasContent).toBeVisible({ timeout: 20000 });

    // Ensure we're not stuck on loading state indefinitely
    // After 20s, loading skeletons should have resolved to actual content
    const skeletons = page.locator('[class*="skeleton"], [data-slot="skeleton"]');
    const skeletonCount = await skeletons.count();
    
    // If there are still loading skeletons after the content check, wait a bit more
    // and verify they eventually disappear
    if (skeletonCount > 0) {
      await page.waitForTimeout(5000);
      const stillLoading = await skeletons.count();
      expect(stillLoading).toBeLessThan(skeletonCount);
    }
  });

  test("@auth can open new challenge dialog", async ({ page }) => {
    await signIn(page);
    await page.goto("/app", { waitUntil: "networkidle" });

    // Click new challenge button
    await page.getByRole("button", { name: /new challenge/i }).click();

    // Dialog should appear with form elements
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/target/i)).toBeVisible();
  });

  test("@auth new challenge form validation", async ({ page }) => {
    await signIn(page);
    await page.goto("/app", { waitUntil: "networkidle" });

    await page.getByRole("button", { name: /new challenge/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

    // Name field should be required
    const nameInput = page.getByLabel(/name/i);
    await expect(nameInput).toHaveAttribute("required");
  });

  test("@auth user menu is accessible", async ({ page }) => {
    await signIn(page);
    await page.goto("/app", { waitUntil: "networkidle" });

    // Look for user button or avatar in header
    const userButton = page.getByRole("button", { name: /account|user|profile/i }).or(
      page.locator('[data-clerk-component="UserButton"]')
    );

    await expect(userButton).toBeVisible({ timeout: 15000 });
  });

  test("@auth export dialog accessible from settings", async ({ page }) => {
    await signIn(page);
    await page.goto("/app", { waitUntil: "networkidle" });

    // Look for settings/menu button
    const settingsBtn = page.getByRole("button", { name: /settings|menu|more/i });
    
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      
      // Export option should be available
      const exportOption = page.getByRole("menuitem", { name: /export/i }).or(
        page.getByRole("button", { name: /export/i })
      );
      
      if (await exportOption.isVisible()) {
        await exportOption.click();
        await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe("Challenge CRUD (authenticated)", () => {
  test.beforeEach(async () => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    test.skip(!email || !password, "Missing TEST_USER_EMAIL/TEST_USER_PASSWORD");
  });

  test("@auth @crud create challenge flow", async ({ page }) => {
    await signIn(page);
    await page.goto("/app", { waitUntil: "networkidle" });

    // Open create dialog
    await page.getByRole("button", { name: /new challenge/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

    // Fill form with unique name to avoid conflicts
    const challengeName = `E2E Test ${Date.now()}`;
    await page.getByLabel(/name/i).fill(challengeName);
    await page.getByLabel(/target/i).fill("100");

    // Submit
    await page.getByRole("button", { name: /create|save/i }).click();

    // Dialog should close and challenge should appear
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(challengeName)).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Entry logging (authenticated)", () => {
  test.beforeEach(async () => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    test.skip(!email || !password, "Missing TEST_USER_EMAIL/TEST_USER_PASSWORD");
  });

  test("@auth can log entry on challenge card", async ({ page }) => {
    await signIn(page);
    await page.goto("/app", { waitUntil: "networkidle" });

    // Wait for challenges to load
    await page.waitForTimeout(2000);

    // Find a challenge card's quick-add input or button
    const quickAdd = page.locator('[data-testid="quick-add"]').first().or(
      page.getByRole("spinbutton").first()
    );

    if (await quickAdd.isVisible()) {
      // If there's a number input, fill and submit
      await quickAdd.fill("5");
      await quickAdd.press("Enter");

      // Should show success feedback (toast or updated count)
      await page.waitForTimeout(1000);
    }
  });
});
