import { test, expect } from "@playwright/test";

test.describe("Dashboard (signed-out)", () => {
  test("shows sign-in prompt on /app", async ({ page }) => {
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    
    // Should show the sign-in prompt for unauthenticated users
    await expect(page.getByRole("heading", { name: /track your progress/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();
  });

  test("@regression Clerk env var resolution does not break page", async ({ page }) => {
    // Regression test for blank screen when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    // is missing but _DEV/_PROD variants exist (see clerk-public.ts).
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    
    // Page must show either:
    // 1. SignedOut content ("Track Your Progress" + "Get Started")
    // 2. SignedIn content (challenges or empty state)
    // NOT a blank page with only header visible
    const signedOutContent = page.getByRole("heading", { name: /track your progress/i });
    const signedInContent = page.locator('[data-testid="challenges-section"], [data-testid="empty-state"]');
    
    // At least one of these should be visible within 10s
    await expect(signedOutContent.or(signedInContent.first())).toBeVisible({ timeout: 10000 });
    
    // Ensure header is present (basic page structure working)
    await expect(page.getByRole("heading", { name: "Tally" })).toBeVisible();
  });

  test("landing page has proper navigation", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    
    // Verify header elements
    await expect(page.getByRole("heading", { name: "Tally" })).toBeVisible();
    
    // Check CTA buttons
    const signInBtn = page.getByRole("link", { name: /sign in/i }).first();
    await expect(signInBtn).toBeVisible();
  });

  test("@ui dashboard signed-out snapshot", async ({ page }) => {
    await page.goto("/app", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /track your progress/i })).toBeVisible();
    
    await expect(page).toHaveScreenshot("app-signed-out.png", { fullPage: true });
  });
});

test.describe("Navigation flows", () => {
  // Clerk sign-in/sign-up pages load asynchronously via external JavaScript.
  // These tests verify the page loads without errors, but Clerk JS loading
  // can be flaky in CI environments due to network conditions.
  test("sign-in page loads correctly", async ({ page }) => {
    const response = await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
    
    // Page should load successfully (HTTP 200)
    expect(response?.status()).toBe(200);
    
    // Wait for either Clerk's sign-in component or the page structure
    // Clerk components may render with visibility:hidden initially, so we check for DOM presence
    await expect(page.locator(".flex.min-h-screen")).toBeAttached({ timeout: 10000 });
  });

  test("sign-up page loads correctly", async ({ page }) => {
    const response = await page.goto("/sign-up", { waitUntil: "domcontentloaded" });
    
    // Page should load successfully (HTTP 200)
    expect(response?.status()).toBe(200);
    
    // Wait for either Clerk's sign-up component or the page structure
    // Clerk components may render with visibility:hidden initially, so we check for DOM presence
    await expect(page.locator(".flex.min-h-screen")).toBeAttached({ timeout: 10000 });
  });

  test("iOS page loads", async ({ page }) => {
    await page.goto("/ios", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /ios/i })).toBeVisible();
  });

  test("Android page loads", async ({ page }) => {
    await page.goto("/android", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /android/i })).toBeVisible();
  });
});

test.describe("Landing page features", () => {
  test("displays feature highlights", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    
    // Check for key value propositions
    await expect(page.getByText(/track anything/i)).toBeVisible();
  });

  test("CTA buttons navigate correctly", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    
    // Test sign-up CTA
    const signUpBtn = page.getByRole("link", { name: /create an account|get started/i }).first();
    await signUpBtn.click();
    await expect(page).toHaveURL(/\/sign-up/);
  });

  test("has accessible navigation", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    
    // Check main navigation is accessible
    const nav = page.getByRole("banner");
    await expect(nav).toBeVisible();
    
    // Logo/brand link exists
    await expect(page.getByRole("heading", { name: "Tally" })).toBeVisible();
  });
});
