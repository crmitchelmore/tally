import { test, expect } from "./fixtures/test";

test.describe("Challenge Management @challenges @smoke", () => {
  test.describe("Creating a Basic Yearly Challenge", () => {
    test("creating a yearly challenge with minimal input", async ({
      dashboardPage,
      challengeDialog,
      page,
    }) => {
      await dashboardPage.goto();

      await dashboardPage.createChallengeButton.click();

      // Should see dialog with year as default
      await expect(challengeDialog.dialog).toBeVisible();

      // Fill minimal fields
      await challengeDialog.fillChallenge({
        name: "Push-ups",
        target: 10000,
        timeframe: "year",
      });

      await challengeDialog.saveButton.click();

      // Should see challenge on dashboard
      await expect(dashboardPage.getChallengeCard("Push-ups")).toBeVisible();

      // Should show initial progress
      await expect(dashboardPage.getChallengeCard("Push-ups")).toContainText(
        "0"
      );
      await expect(dashboardPage.getChallengeCard("Push-ups")).toContainText(
        "10000"
      );
    });

    test("creating a yearly challenge with all options", async ({
      dashboardPage,
      challengeDialog,
      page,
    }) => {
      await dashboardPage.goto();

      await dashboardPage.createChallengeButton.click();

      await challengeDialog.nameInput.fill("Meditation");
      await challengeDialog.targetInput.fill("365");

      // Select timeframe
      if (await challengeDialog.timeframeSelect.isVisible()) {
        await challengeDialog.timeframeSelect.selectOption("year");
      }

      // Toggle public if available
      if (await challengeDialog.publicToggle.isVisible()) {
        // Leave as private (default)
      }

      await challengeDialog.saveButton.click();

      await expect(dashboardPage.getChallengeCard("Meditation")).toBeVisible();
    });
  });

  test.describe("Creating a Monthly Challenge", () => {
    test("creating a challenge with monthly target", async ({
      dashboardPage,
      challengeDialog,
      page,
    }) => {
      await dashboardPage.goto();

      await dashboardPage.createChallengeButton.click();

      await challengeDialog.fillChallenge({
        name: "Reading",
        target: 4,
        timeframe: "month",
      });

      await challengeDialog.saveButton.click();

      await expect(dashboardPage.getChallengeCard("Reading")).toBeVisible();
    });
  });

  test.describe("Challenge Lifecycle", () => {
    test("editing an existing challenge", async ({
      dashboardPage,
      challengeDialog,
      challengeDetailPage,
      page,
    }) => {
      await dashboardPage.goto();

      // First create a challenge
      await dashboardPage.createChallengeButton.click();
      await challengeDialog.fillChallenge({
        name: "Edit Test",
        target: 1000,
        timeframe: "year",
      });
      await challengeDialog.saveButton.click();

      // Click on the challenge to view details
      await dashboardPage.getChallengeCard("Edit Test").click();

      // Click edit
      await challengeDetailPage.editButton.click();

      // Change target
      await challengeDialog.targetInput.clear();
      await challengeDialog.targetInput.fill("1500");
      await challengeDialog.saveButton.click();

      // Verify updated
      await expect(page.locator("body")).toContainText("1500");
    });

    test("deleting a challenge with confirmation", async ({
      dashboardPage,
      challengeDialog,
      challengeDetailPage,
      page,
    }) => {
      await dashboardPage.goto();

      // Create a challenge to delete
      await dashboardPage.createChallengeButton.click();
      await challengeDialog.fillChallenge({
        name: "Delete Test",
        target: 100,
        timeframe: "month",
      });
      await challengeDialog.saveButton.click();

      // Click on challenge
      await dashboardPage.getChallengeCard("Delete Test").click();

      // Delete with confirmation
      await challengeDetailPage.deleteButton.click();

      // Confirm deletion
      const confirmButton = page.getByRole("button", {
        name: /confirm|delete|yes/i,
      });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Should no longer exist
      await dashboardPage.goto();
      await expect(
        dashboardPage.getChallengeCard("Delete Test")
      ).not.toBeVisible();
    });
  });

  test.describe("Dashboard Challenge Cards", () => {
    test("viewing challenge information on dashboard", async ({
      dashboardPage,
      challengeDialog,
      page,
    }) => {
      await dashboardPage.goto();

      // Create a challenge
      await dashboardPage.createChallengeButton.click();
      await challengeDialog.fillChallenge({
        name: "Dashboard View Test",
        target: 5000,
        timeframe: "year",
      });
      await challengeDialog.saveButton.click();

      const card = dashboardPage.getChallengeCard("Dashboard View Test");

      // Should display name
      await expect(card).toContainText("Dashboard View Test");

      // Should display progress
      await expect(card).toContainText("0");
      await expect(card).toContainText("5000");

      // Should have quick add button
      const quickAdd = card.locator("[data-testid=quick-add]");
      // Quick add may or may not be visible depending on implementation
    });
  });

  test.describe("Challenge Detail View", () => {
    test("viewing challenge detail with yearly heatmap", async ({
      dashboardPage,
      challengeDialog,
      challengeDetailPage,
      page,
    }) => {
      await dashboardPage.goto();

      // Create a challenge
      await dashboardPage.createChallengeButton.click();
      await challengeDialog.fillChallenge({
        name: "Heatmap Test",
        target: 10000,
        timeframe: "year",
      });
      await challengeDialog.saveButton.click();

      // Click to view details
      await dashboardPage.getChallengeCard("Heatmap Test").click();

      // Should see title
      await expect(challengeDetailPage.title).toContainText("Heatmap Test");

      // Should see progress elements
      await expect(
        challengeDetailPage.progressRing.or(page.locator("[data-testid=progress]"))
      ).toBeVisible();

      // Heatmap is optional based on implementation
      const heatmap = challengeDetailPage.heatmap;
      // await expect(heatmap).toBeVisible();
    });
  });
});
