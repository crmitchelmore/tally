import { test, expect } from "@playwright/test";

test("signed-out home renders and sign-in links navigate", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "Tally" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Track Your Progress" })
  ).toBeVisible();

  await page.getByRole("link", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/sign-in/);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "Get Started" }).click();
  await expect(page).toHaveURL(/\/sign-in/);
});

test("component test page renders", async ({ page }) => {
  await page.goto("/test-components", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Component Test Page" })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tally Marks" })).toBeVisible();
});
