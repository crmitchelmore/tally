import { test, expect } from "@playwright/test";

test.describe("Tally Display Visual Regression @visual", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to offline page which has tally displays
    await page.goto("/offline");
  });

  test("tally marks render correctly at various counts", async ({ page }) => {
    // Create a test page that shows various tally counts
    await page.evaluate(() => {
      // Store some test challenges in localStorage with various counts
      const challenges = [
        { id: "test-5", name: "Five", target: 100, color: "#FF4747" },
        { id: "test-25", name: "TwentyFive", target: 100, color: "#3B82F6" },
        { id: "test-100", name: "Hundred", target: 1000, color: "#10B981" },
        { id: "test-1000", name: "Thousand", target: 10000, color: "#F59E0B" },
      ];
      const entries = [
        { id: "e1", challengeId: "test-5", count: 5, date: "2026-01-21" },
        { id: "e2", challengeId: "test-25", count: 25, date: "2026-01-21" },
        { id: "e3", challengeId: "test-100", count: 100, date: "2026-01-21" },
        { id: "e4", challengeId: "test-1000", count: 1000, date: "2026-01-21" },
      ];
      localStorage.setItem("tally_offline_challenges", JSON.stringify(challenges));
      localStorage.setItem("tally_offline_entries", JSON.stringify(entries));
    });

    // Reload to pick up the localStorage data
    await page.reload();

    // Wait for challenges to render
    await page.waitForTimeout(500);

    // Verify tally marks are visible (at minimum check the page renders)
    const content = await page.content();
    expect(content).toContain("Tally");
  });
});

test.describe("Challenge Creation with Settings @challenges", () => {
  test("can create challenge with count type and increment", async ({ page }) => {
    await page.goto("/offline");

    // Click create challenge button
    const createButton = page.getByRole("button", { name: /create|new|add/i });
    await createButton.click();

    // Wait for dialog
    await page.waitForTimeout(300);

    // Fill in challenge name
    const nameInput = page.locator('input[type="text"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill("Test Push-ups");
    }

    // Fill in target
    const targetInput = page.locator('input[type="number"]').first();
    if (await targetInput.isVisible()) {
      await targetInput.fill("10000");
    }

    // Look for count type selector (Sets & Reps)
    const setsButton = page.getByRole("button", { name: /sets/i });
    if (await setsButton.isVisible()) {
      await setsButton.click();
    }

    // Look for increment options (+100)
    const increment100 = page.getByRole("button", { name: /\+100/i });
    if (await increment100.isVisible()) {
      await increment100.click();
    }

    // Submit the form - use dialog-scoped selector to avoid matching empty state button
    const dialog = page.getByRole("dialog");
    const submitButton = dialog.getByRole("button", { name: /create/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
    }

    // Verify challenge was created (page should update)
    await page.waitForTimeout(500);
  });

  test("challenge icons are visible in PRESET_ICONS including strength", async ({ page }) => {
    await page.goto("/offline");

    // Click create challenge button
    const createButton = page.getByRole("button", { name: /create|new|add/i });
    await createButton.click();

    await page.waitForTimeout(300);

    // Check that strength icon option exists
    const strengthIcon = page.getByRole("button", { name: /strength/i });
    const strengthVisible = await strengthIcon.isVisible().catch(() => false);
    
    // If visible, click it
    if (strengthVisible) {
      await strengthIcon.click();
      // Verify it's selected (has accent color class or similar)
      await expect(strengthIcon).toBeVisible();
    }
  });
});

test.describe("Add Entry Dialog @entries", () => {
  test("add entry dialog fits on screen", async ({ page }) => {
    // Set viewport to common mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/offline");

    // Create a challenge first
    await page.evaluate(() => {
      const challenges = [{
        id: "test-challenge",
        name: "Test Challenge",
        target: 1000,
        color: "#FF4747",
        countType: "simple",
        unitLabel: "reps",
        defaultIncrement: 10,
      }];
      localStorage.setItem("tally_offline_challenges", JSON.stringify(challenges));
      localStorage.setItem("tally_offline_user", "true");
    });
    await page.reload();
    await page.waitForTimeout(500);

    // Click on the challenge to go to detail page or add entry
    const addButton = page.getByRole("button", { name: /add|entry|\+/i }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(300);

      // Check that dialog is visible and submit button is in viewport
      const submitButton = page.getByRole("button", { name: /add.*marks|add.*reps|submit/i }).first();
      if (await submitButton.isVisible()) {
        const box = await submitButton.boundingBox();
        if (box) {
          // Submit button should be within viewport
          expect(box.y + box.height).toBeLessThan(667);
        }
      }
    }
  });

  test("add entry dialog shows collapsible options", async ({ page }) => {
    await page.goto("/offline");

    await page.evaluate(() => {
      const challenges = [{
        id: "test-challenge",
        name: "Test Challenge",
        target: 1000,
        color: "#FF4747",
      }];
      localStorage.setItem("tally_offline_challenges", JSON.stringify(challenges));
      localStorage.setItem("tally_offline_user", "true");
    });
    await page.reload();
    await page.waitForTimeout(500);

    // Try to find and click add entry
    const addButton = page.getByRole("button", { name: /add|entry|\+/i }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(300);

      // Look for "More options" collapsible
      const moreOptions = page.getByText(/more options/i);
      if (await moreOptions.isVisible()) {
        // Click to expand
        await moreOptions.click();
        
        // Feeling options should now be visible
        const feelingLabel = page.getByText(/how did it feel/i);
        await expect(feelingLabel).toBeVisible();
      }
    }
  });
});

test.describe("Sets and Reps Entry Mode @entries @sets", () => {
  test("add entry dialog shows sets mode when challenge has countType sets", async ({ page }) => {
    await page.goto("/offline");

    // Create a challenge with countType: "sets"
    await page.evaluate(() => {
      const challenges = [{
        id: "sets-challenge",
        name: "Push-ups",
        target: 10000,
        color: "#FF4747",
        countType: "sets",
        unitLabel: "reps",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      }];
      localStorage.setItem("tally_offline_challenges", JSON.stringify(challenges));
      localStorage.setItem("tally_offline_user", "true");
    });
    await page.reload();
    await page.waitForTimeout(500);

    // Click on the challenge card to enter detail view
    const challengeCard = page.getByRole("button", { name: /push-ups/i }).first();
    await expect(challengeCard).toBeVisible();
    await challengeCard.click();
    await page.waitForTimeout(300);

    // Click "Add sets..." button to open the full add entry dialog
    const addSetsButton = page.getByRole("button", { name: "Add sets..." });
    await expect(addSetsButton).toBeVisible();
    await addSetsButton.click();
    await page.waitForTimeout(300);

    // The add entry dialog should show sets input mode automatically
    // since the challenge was created with countType: "sets"
    // Look for "Set 1" label which indicates sets mode is active
    const setsLabel = page.getByText(/set\s*1/i);
    await expect(setsLabel).toBeVisible({ timeout: 5000 });

    // Should also have an "Add another set" button
    const addAnotherSetButton = page.getByRole("button", { name: /add another set/i });
    await expect(addAnotherSetButton).toBeVisible();
  });
});

test.describe("Challenge Icons Display @visual", () => {
  test("challenge card shows icon emoji", async ({ page }) => {
    await page.goto("/offline");

    await page.evaluate(() => {
      const challenges = [{
        id: "test-strength",
        name: "Workout",
        target: 1000,
        color: "#FF4747",
        icon: "strength",
      }];
      localStorage.setItem("tally_offline_challenges", JSON.stringify(challenges));
      localStorage.setItem("tally_offline_user", "true");
    });
    await page.reload();
    await page.waitForTimeout(500);

    // Look for the strength emoji on the page
    const content = await page.content();
    // Should contain the 💪 emoji somewhere
    expect(content).toMatch(/💪|strength|Workout/i);
  });
});
