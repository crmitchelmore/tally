import { test, expect } from "./fixtures/test";

test.describe("New User Onboarding @web @smoke @onboarding", () => {
  test.describe("Landing Page", () => {
    test("viewing the landing page for the first time", async ({
      landingPage,
      page,
    }) => {
      await landingPage.goto();

      // Should see the landing page
      await expect(page).toHaveTitle(/tally/i);
      await expect(landingPage.heroSection).toBeVisible();

      // Should see prominent CTA
      await expect(landingPage.startTrackingButton).toBeVisible();
    });

    test("interacting with the landing page micro-demo", async ({
      landingPage,
      page,
    }) => {
      await landingPage.goto();

      // Skip if micro-demo not implemented yet
      const hasMicroDemo = await landingPage.microDemo.isVisible();
      if (!hasMicroDemo) {
        test.skip();
        return;
      }

      // Tap +1 button
      await landingPage.incrementButton.click();

      // Should see count increment (check for animation or count change)
      await expect(page.locator("[data-testid=demo-count]")).toContainText("1");
    });
  });

  test.describe("Starting to Use the App", () => {
    test("clicking through to start using the app", async ({
      landingPage,
      page,
    }) => {
      await landingPage.goto();

      await landingPage.startTrackingButton.click();

      // Should redirect to app dashboard or offline mode
      await expect(page).toHaveURL(/\/(app|offline)/);
    });

    test("seeing the empty dashboard as a new user", async ({
      dashboardPage,
      page,
    }) => {
      await dashboardPage.goto();

      // Should see empty state with guidance
      const hasEmptyState = await dashboardPage.emptyState.isVisible();
      const hasCreateButton =
        await dashboardPage.createChallengeButton.isVisible();

      // Either empty state or create button should be visible
      expect(hasEmptyState || hasCreateButton).toBe(true);
    });
  });

  test.describe("Quick Start Flow", () => {
    test("creating first challenge from empty state", async ({
      dashboardPage,
      challengeDialog,
      page,
    }) => {
      await dashboardPage.goto();

      // Click create challenge
      await dashboardPage.createChallengeButton.click();

      // Should see challenge creation dialog
      await expect(challengeDialog.dialog).toBeVisible();

      // Should have minimal required fields
      await expect(challengeDialog.nameInput).toBeVisible();
      await expect(challengeDialog.targetInput).toBeVisible();
    });

    test("completing the quick start with a yearly challenge", async ({
      dashboardPage,
      challengeDialog,
      page,
    }) => {
      await dashboardPage.goto();

      await dashboardPage.createChallengeButton.click();

      // Fill challenge details
      await challengeDialog.fillChallenge({
        name: "Push-ups",
        target: 10000,
        timeframe: "year",
      });

      await challengeDialog.saveButton.click();

      // Should see challenge on dashboard
      await expect(dashboardPage.getChallengeCard("Push-ups")).toBeVisible();
    });
  });
});
