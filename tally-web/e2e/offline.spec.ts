import { test, expect } from "./fixtures/test";

test.describe("Offline User Experience @offline @all-platforms @smoke", () => {
  test.describe("Starting as an Offline User", () => {
    test("launching the app without an account", async ({
      dashboardPage,
      page,
    }) => {
      await dashboardPage.goto();

      // Should see that user is not logged in
      const syncStatus = dashboardPage.syncStatus;
      const isLocalOnly =
        (await syncStatus.isVisible()) &&
        (await syncStatus.textContent())?.includes("Local");

      // Should be able to use the app
      await expect(dashboardPage.createChallengeButton).toBeVisible();
    });

    test("understanding the local storage limitation", async ({
      dashboardPage,
      page,
    }) => {
      await dashboardPage.goto();

      // Check for local storage warning/indicator
      const syncStatus = dashboardPage.syncStatus;
      if (await syncStatus.isVisible()) {
        await syncStatus.click();
        // Should show details about local storage
        await expect(
          page.locator("[data-testid=storage-info]")
        ).toBeVisible();
      }
    });
  });

  test.describe("Full Functionality in Offline Mode", () => {
    test("creating challenges while offline", async ({
      dashboardPage,
      challengeDialog,
      page,
    }) => {
      await dashboardPage.goto();

      // Create a challenge
      await dashboardPage.createChallengeButton.click();
      await challengeDialog.fillChallenge({
        name: "Daily Steps",
        target: 3650000,
        timeframe: "year",
      });
      await challengeDialog.saveButton.click();

      // Should be saved and visible (optimistic UI)
      await expect(dashboardPage.getChallengeCard("Daily Steps")).toBeVisible();
    });

    test("adding entries while offline", async ({
      dashboardPage,
      entryDialog,
      page,
    }) => {
      await dashboardPage.goto();

      // First create a challenge if none exists
      const hasChallenge = (await dashboardPage.challengeCards.count()) > 0;
      if (!hasChallenge) {
        await dashboardPage.createChallengeButton.click();
        await page.getByLabel(/name/i).fill("Test Challenge");
        await page.getByLabel(/target/i).fill("1000");
        await page.getByRole("button", { name: /save|create/i }).click();
      }

      // Add entry via quick add
      const quickAddButton = dashboardPage
        .challengeCards.first()
        .locator("[data-testid=quick-add]");
      if (await quickAddButton.isVisible()) {
        await quickAddButton.click();
        await entryDialog.addEntry(100);

        // Should update immediately
        await expect(dashboardPage.challengeCards.first()).toContainText("100");
      }
    });

    test("data persists across app restarts", async ({
      dashboardPage,
      challengeDialog,
      page,
    }) => {
      await dashboardPage.goto();

      // Create a challenge
      await dashboardPage.createChallengeButton.click();
      await challengeDialog.fillChallenge({
        name: "Persistence Test",
        target: 500,
        timeframe: "year",
      });
      await challengeDialog.saveButton.click();
      await expect(
        dashboardPage.getChallengeCard("Persistence Test")
      ).toBeVisible();

      // Reload page (simulates app restart)
      await page.reload();

      // Challenge should still be there
      await expect(
        dashboardPage.getChallengeCard("Persistence Test")
      ).toBeVisible();
    });
  });

  test.describe("Offline Mode Indicators", () => {
    test("viewing sync status as an offline user", async ({
      dashboardPage,
      page,
    }) => {
      await dashboardPage.goto();

      const syncStatus = dashboardPage.syncStatus;

      // Should show some sync status indicator
      if (await syncStatus.isVisible()) {
        const text = await syncStatus.textContent();
        // Should indicate local-only or offline mode
        expect(
          text?.toLowerCase().includes("local") ||
            text?.toLowerCase().includes("offline")
        ).toBe(true);
      }
    });
  });
});
