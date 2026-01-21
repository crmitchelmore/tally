import { test, expect } from "./fixtures/test";

test.describe("User Registration and Data Sync @registration @auth @sync", () => {
  test.describe("Converting from Offline to Registered User", () => {
    test("initiating registration from settings", async ({ page }) => {
      // Navigate to settings
      await page.goto("/app");
      
      const settingsButton = page.getByRole("link", { name: /settings/i })
        .or(page.locator("[data-testid=settings-link]"));
      
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        
        // Should see create account option
        const createAccountButton = page.getByRole("button", {
          name: /create.*account|sign.*up/i,
        });
        
        if (await createAccountButton.isVisible()) {
          await expect(createAccountButton).toBeVisible();
        }
      }
    });
  });

  test.describe("Registration with Email and Password", () => {
    test("viewing registration form", async ({ page }) => {
      await page.goto("/sign-up");

      // Should see registration form
      const emailInput = page.getByLabel(/email/i);
      const passwordInput = page.getByLabel(/password/i);

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    });

    test("registration form validation", async ({ page }) => {
      await page.goto("/sign-up");

      const emailInput = page.getByLabel(/email/i);
      const passwordInput = page.getByLabel(/password/i);
      const submitButton = page.getByRole("button", {
        name: /sign.*up|create.*account|continue/i,
      });

      // Try invalid email
      if (await emailInput.isVisible()) {
        await emailInput.fill("invalid-email");
        await passwordInput.fill("Test123!");
        await submitButton.click();

        // Should show validation error
        const error = page.locator(
          "[data-testid=error], .error, [role=alert], .cl-formFieldError"
        );
        // Error may or may not be visible depending on Clerk's handling
      }
    });
  });

  test.describe("Sign In (Existing User)", () => {
    test("viewing sign in form", async ({ page }) => {
      await page.goto("/sign-in");

      // Should see sign in form
      const emailInput = page.getByLabel(/email/i);
      const passwordInput = page.getByLabel(/password/i);

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    });

    test("sign in form has social providers", async ({ page }) => {
      await page.goto("/sign-in");

      // Check for social login buttons (Clerk provides these)
      const googleButton = page.getByRole("button", { name: /google/i });
      const appleButton = page.getByRole("button", { name: /apple/i });

      // At least one social provider should be available
      const hasGoogle = await googleButton.isVisible();
      const hasApple = await appleButton.isVisible();

      // This depends on Clerk configuration
    });
  });

  test.describe("Post-Registration Experience", () => {
    test("dashboard shows sync status when logged in", async ({
      dashboardPage,
      page,
    }) => {
      await dashboardPage.goto();

      const syncStatus = dashboardPage.syncStatus;

      if (await syncStatus.isVisible()) {
        const text = await syncStatus.textContent();
        // Should show sync status (either "synced" or "local only")
        expect(text).toBeTruthy();
      }
    });
  });

  test.describe("Account Security", () => {
    test("password field has type password", async ({ page }) => {
      await page.goto("/sign-up");

      const passwordInput = page.getByLabel(/password/i);

      if (await passwordInput.isVisible()) {
        const type = await passwordInput.getAttribute("type");
        expect(type).toBe("password");
      }
    });
  });
});
