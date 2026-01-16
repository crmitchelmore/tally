import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("displays hero section and CTA", async ({ page }) => {
    await page.goto("/");
    
    // Check hero text
    await expect(page.locator("h1")).toContainText("Track");
    
    // Check CTA button
    await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();
  });

  test("navigates to sign-in", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Sign in");
    await expect(page).toHaveURL(/sign-in/);
  });
});

test.describe("App Page (unauthenticated)", () => {
  test("redirects to sign-in prompt", async ({ page }) => {
    await page.goto("/app");
    
    // Should show sign-in prompt when not authenticated
    await expect(page.locator("text=Sign in to start")).toBeVisible();
  });
});

test.describe("Community Page", () => {
  test("displays search and public challenges", async ({ page }) => {
    await page.goto("/community");
    
    // Search input should be visible
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    
    // Public challenges section
    await expect(page.locator("text=Public Challenges")).toBeVisible();
  });
});

test.describe("Leaderboard Page", () => {
  test("displays time range filters", async ({ page }) => {
    await page.goto("/leaderboard");
    
    // Time range buttons
    await expect(page.getByRole("button", { name: /this week/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /this month/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /all time/i })).toBeVisible();
  });
});
