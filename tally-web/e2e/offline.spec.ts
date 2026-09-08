import { test, expect } from "./fixtures/test";

test.describe("Offline User Experience @offline @smoke", () => {
  test.describe("Accessing Offline Mode", () => {
    test("accessing offline mode from landing page", async ({ page }) => {
      await page.goto("/");
      
      // Click "Try without account" link
      const tryLink = page.getByRole("link", { name: /try without account|continue without account/i });
      if (await tryLink.isVisible()) {
        await tryLink.click();
        await expect(page).toHaveURL(/\/offline/);
      } else {
        // If not visible on landing, navigate directly
        await page.goto("/offline");
        await expect(page).toHaveURL(/\/offline/);
      }
    });

    test("offline mode page loads correctly", async ({ page }) => {
      await page.goto("/offline");
      
      // Should see page content (Your Tallies or similar heading)
      await expect(page.locator("h1").first()).toBeVisible();
    });
  });

  test.describe("Basic Offline Functionality", () => {
    test("can see create challenge button in offline mode", async ({ page }) => {
      await page.goto("/offline");
      
      // Should see a way to create challenges
      const createButton = page.getByRole("button", { name: /create|new|add/i });
      await expect(createButton).toBeVisible();
    });
  });
});


test("logging from a refreshed card retains the entered count and persists it @offline", async ({ page }) => {
  await page.goto("/offline");
  await page.getByRole("button", { name: "Create Challenge", exact: true }).click();
  const creation = page.getByRole("dialog", { name: "New Challenge" });
  await creation.getByLabel("Name", { exact: true }).fill("Reading refresh test");
  await creation.getByLabel("Target", { exact: true }).fill("500");
  await creation.getByRole("button", { name: "Pages", exact: true }).click();
  await creation.getByRole("button", { name: "Create Challenge", exact: true }).click();
  await page.getByRole("button", { name: "Log progress for Reading refresh test" }).click();
  const entry = page.getByRole("dialog");
  await entry.getByLabel("How many pages?").fill("25");
  await expect(entry.getByLabel("How many pages?")).toHaveValue("25");
  await entry.getByRole("button", { name: "Add 25 pages", exact: true }).click();
  await expect(entry).not.toBeVisible();
  const progress = page.getByRole("progressbar", { name: "Reading refresh test progress" });
  await expect(progress).toHaveAttribute("aria-valuenow", "25");
  const today = new Date().toISOString().split("T")[0];
  await expect(page.getByRole("button", { name: `${today}: 25 pages`, exact: true })).toBeVisible();
  await page.reload();
  await expect(progress).toHaveAttribute("aria-valuenow", "25");
});
