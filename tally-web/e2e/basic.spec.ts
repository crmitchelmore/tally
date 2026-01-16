import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("displays hero section and CTA", async ({ page }) => {
    await page.goto("/");
    
    // Check hero text
    await expect(page.locator("h1")).toContainText("Track");
    
    // Check CTA buttons
    await expect(page.getByRole("link", { name: /create an account/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });

  test("displays how it works section", async ({ page }) => {
    await page.goto("/");
    
    await expect(page.locator("text=How it works")).toBeVisible();
    await expect(page.locator("text=Set a challenge")).toBeVisible();
    await expect(page.locator("text=Log your progress")).toBeVisible();
    await expect(page.locator("text=Stay on pace")).toBeVisible();
  });

  test("navigates to sign-in", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Sign in");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("navigates to sign-up", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Create an account");
    await expect(page).toHaveURL(/sign-up/);
  });
});

test.describe("App Page (unauthenticated)", () => {
  test("shows sign-in prompt when not authenticated", async ({ page }) => {
    await page.goto("/app");
    
    // Should show welcome message and sign-in options
    await expect(page.locator("h1")).toContainText("Welcome to Tally");
    await expect(page.getByRole("link", { name: /create an account/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });
});

test.describe("Community Page", () => {
  test("displays search and public challenges section", async ({ page }) => {
    await page.goto("/community");
    
    // Header
    await expect(page.locator("h1")).toContainText("Community");
    
    // Search input should be visible
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    
    // Public challenges section
    await expect(page.locator("text=Public Challenges")).toBeVisible();
  });

  test("can search challenges", async ({ page }) => {
    await page.goto("/community");
    
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("test");
    
    // Search should filter (just verify no crash)
    await expect(searchInput).toHaveValue("test");
  });
});

test.describe("Leaderboard Page", () => {
  test("displays time range filters", async ({ page }) => {
    await page.goto("/leaderboard");
    
    // Header
    await expect(page.locator("h1")).toContainText("Leaderboard");
    
    // Time range buttons
    await expect(page.getByRole("button", { name: /this week/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /this month/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /this year/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /all time/i })).toBeVisible();
  });

  test("can switch time ranges", async ({ page }) => {
    await page.goto("/leaderboard");
    
    // Click different time ranges
    await page.getByRole("button", { name: /this week/i }).click();
    await expect(page.getByRole("button", { name: /this week/i })).toHaveAttribute("data-state", "active");
    
    await page.getByRole("button", { name: /all time/i }).click();
    await expect(page.getByRole("button", { name: /all time/i })).toHaveAttribute("data-state", "active");
  });
});

test.describe("Accessibility", () => {
  test("landing page has proper heading hierarchy", async ({ page }) => {
    await page.goto("/");
    
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
    
    // H2s for sections
    const h2s = page.locator("h2");
    await expect(h2s).toHaveCount(2); // "How it works" and "Ready to start"
  });

  test("interactive elements are keyboard accessible", async ({ page }) => {
    await page.goto("/");
    
    // Tab to first CTA
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    
    // Should be able to activate with Enter
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
  });
});
