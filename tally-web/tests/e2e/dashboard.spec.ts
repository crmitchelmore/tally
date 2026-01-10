import { test, expect } from "@playwright/test";

test.describe("Dashboard (signed-out)", () => {
  test("shows sign-in prompt on /app", async ({ page }) => {
    await page.goto("/app", { waitUntil: "domcontentloaded" });
    
    // Should show the sign-in prompt for unauthenticated users
    await expect(page.getByRole("heading", { name: /track your progress/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();
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
  test("sign-in page loads correctly", async ({ page }) => {
    await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
    
    // Clerk sign-in form should be present
    await expect(page.locator('[data-clerk-component="SignIn"]')).toBeVisible({ timeout: 10000 });
  });

  test("sign-up page loads correctly", async ({ page }) => {
    await page.goto("/sign-up", { waitUntil: "domcontentloaded" });
    
    // Clerk sign-up form should be present
    await expect(page.locator('[data-clerk-component="SignUp"]')).toBeVisible({ timeout: 10000 });
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
