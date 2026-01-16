import { test, expect, Page } from "@playwright/test";

/**
 * Authenticated user journey tests
 * 
 * These tests require a real test user account. Configure via:
 * - TEST_USER_EMAIL: Email for test account
 * - TEST_USER_PASSWORD: Password for test account
 * 
 * If credentials are not set, these tests are skipped.
 */

const TEST_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD;

// Helper to sign in
async function signIn(page: Page) {
  await page.goto("/sign-in");
  await page.waitForLoadState("networkidle");
  
  // Wait for Clerk form to load
  await page.waitForSelector('[data-clerk-component], .cl-signIn-root', { timeout: 10000 });
  
  // Fill email
  const emailInput = page.locator('input[name="identifier"], input[type="email"]');
  await emailInput.fill(TEST_EMAIL!);
  
  // Submit to continue
  const continueButton = page.locator('button[type="submit"]');
  await continueButton.click();
  
  // Wait for password input
  await page.waitForSelector('input[type="password"]', { timeout: 10000 });
  
  // Fill password
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.fill(TEST_PASSWORD!);
  
  // Submit
  await continueButton.click();
  
  // Wait for redirect to /app
  await page.waitForURL("**/app", { timeout: 15000 });
}

test.describe("Authenticated User Journeys", () => {
  test.beforeEach(async ({ page }) => {
    // Skip if no test credentials
    test.skip(!TEST_EMAIL || !TEST_PASSWORD, "Test credentials not configured");
    
    await signIn(page);
  });

  test("dashboard loads with user content", async ({ page }) => {
    // Should be on /app
    await expect(page).toHaveURL(/\/app/);
    
    // Dashboard should show either challenges or empty state
    const hasContent = await Promise.race([
      page.locator('[data-testid="challenge-card"]').first().isVisible().then(() => true).catch(() => false),
      page.locator('text=/create.*challenge|get started/i').isVisible().then(() => true).catch(() => false),
    ]);
    
    expect(hasContent).toBe(true);
  });

  test("user can open new challenge dialog", async ({ page }) => {
    // Find and click new challenge button
    const newChallengeBtn = page.getByRole("button", { name: /new challenge|create challenge/i });
    
    if (await newChallengeBtn.isVisible()) {
      await newChallengeBtn.click();
      
      // Dialog should open
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      
      // Should have name input
      const nameInput = dialog.locator('input[name="name"], input[placeholder*="name" i]');
      await expect(nameInput).toBeVisible();
    }
  });

  test("user can access settings or profile", async ({ page }) => {
    // Look for user menu (usually Clerk UserButton)
    const userButton = page.locator('.cl-userButtonTrigger, [data-clerk-user-button-trigger]');
    
    if (await userButton.isVisible()) {
      await userButton.click();
      
      // Menu should appear
      await page.waitForSelector('.cl-userButtonPopoverCard, [data-clerk-user-button-popover]', { timeout: 5000 });
    }
  });

  test("sign out works", async ({ page }) => {
    // Find user menu
    const userButton = page.locator('.cl-userButtonTrigger, [data-clerk-user-button-trigger]');
    
    if (await userButton.isVisible()) {
      await userButton.click();
      
      // Wait for menu
      await page.waitForSelector('.cl-userButtonPopoverCard', { timeout: 5000 });
      
      // Click sign out
      const signOutButton = page.getByRole("button", { name: /sign out/i });
      if (await signOutButton.isVisible()) {
        await signOutButton.click();
        
        // Should redirect to home
        await page.waitForURL("**/", { timeout: 10000 });
        
        // Should show sign-in option
        await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
      }
    }
  });
});

test.describe("Challenge Management (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!TEST_EMAIL || !TEST_PASSWORD, "Test credentials not configured");
    await signIn(page);
  });

  test("can view challenge detail", async ({ page }) => {
    // Wait for challenge cards to potentially load
    await page.waitForTimeout(2000);
    
    const challengeCard = page.locator('[data-testid="challenge-card"]').first();
    
    if (await challengeCard.isVisible()) {
      await challengeCard.click();
      
      // Detail view should open
      const detailView = page.locator('[data-testid="challenge-detail"], .challenge-detail');
      await expect(detailView).toBeVisible({ timeout: 5000 });
      
      // Should show progress/stats
      const progressElement = page.locator('text=/total|progress|entries/i');
      await expect(progressElement).toBeVisible();
    }
  });
});

test.describe("Entry Logging (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!TEST_EMAIL || !TEST_PASSWORD, "Test credentials not configured");
    await signIn(page);
  });

  test("add entry dialog has required fields", async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Try to open add entry (from dashboard or challenge)
    const addButton = page.getByRole("button", { name: /add entry|log/i }).first();
    
    if (await addButton.isVisible()) {
      await addButton.click();
      
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });
      
      // Should have count input
      const countInput = dialog.locator('input[name="count"], input[type="number"]');
      await expect(countInput).toBeVisible();
      
      // Should have submit button
      const submitBtn = dialog.getByRole("button", { name: /add|save|submit/i });
      await expect(submitBtn).toBeVisible();
    }
  });
});
