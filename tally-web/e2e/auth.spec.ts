import { test, expect } from "@playwright/test";

test.describe("Authentication Journeys", () => {
  test.describe("Sign Up Page", () => {
    test("renders Clerk sign-up component", async ({ page }) => {
      await page.goto("/sign-up");
      
      // Wait for Clerk to initialize
      await page.waitForLoadState("networkidle");
      
      // Clerk form should be visible (container with form elements)
      const signUpContainer = page.locator(".cl-signUp-root, [data-clerk-component]");
      await expect(signUpContainer).toBeVisible({ timeout: 10000 });
    });

    test("has link to sign-in for existing users", async ({ page }) => {
      await page.goto("/sign-up");
      await page.waitForLoadState("networkidle");
      
      // Look for sign-in link text
      const signInLink = page.getByText(/already have an account|sign in/i);
      await expect(signInLink).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Sign In Page", () => {
    test("renders Clerk sign-in component", async ({ page }) => {
      await page.goto("/sign-in");
      
      await page.waitForLoadState("networkidle");
      
      const signInContainer = page.locator(".cl-signIn-root, [data-clerk-component]");
      await expect(signInContainer).toBeVisible({ timeout: 10000 });
    });

    test("has link to sign-up for new users", async ({ page }) => {
      await page.goto("/sign-in");
      await page.waitForLoadState("networkidle");
      
      const signUpLink = page.getByText(/don't have an account|sign up/i);
      await expect(signUpLink).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Protected Route Access", () => {
    test("app page shows welcome message for unauthenticated users", async ({ page }) => {
      await page.goto("/app");
      
      // Should show sign-in prompt
      await expect(page.locator("h1")).toContainText("Welcome to Tally");
      await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
    });

    test("unauthenticated users can still access landing page", async ({ page }) => {
      await page.goto("/");
      
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.getByRole("link", { name: /create an account/i })).toBeVisible();
    });

    test("unauthenticated users can access community page", async ({ page }) => {
      await page.goto("/community");
      
      await expect(page.locator("h1")).toContainText("Community");
    });

    test("unauthenticated users can access leaderboard page", async ({ page }) => {
      await page.goto("/leaderboard");
      
      await expect(page.locator("h1")).toContainText("Leaderboard");
    });
  });
});
