import { test, expect } from "@playwright/test";

test("signed-out home renders and CTAs navigate", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "Tally" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /track anything you care about/i })
  ).toBeVisible();

  await page
    .getByRole("banner")
    .getByRole("link", { name: /sign in/i })
    .click();
  await expect(page).toHaveURL(/\/sign-in/);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: /create an account/i }).click();
  await expect(page).toHaveURL(/\/sign-up/);
});

test("component test page renders", async ({ page }) => {
  await page.goto("/test-components", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Component Test Page" })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tally Marks" })).toBeVisible();
});
