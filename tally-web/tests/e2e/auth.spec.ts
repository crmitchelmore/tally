import { test, expect } from "@playwright/test";

test("@auth sign-in shows signed-in UI", async ({ page }) => {
  const email = process.env.E2E_CLERK_EMAIL;
  const password = process.env.E2E_CLERK_PASSWORD;

  test.skip(!email || !password, "Missing E2E_CLERK_EMAIL/E2E_CLERK_PASSWORD");

  await page.goto("/sign-in", { waitUntil: "domcontentloaded" });

  // Clerk's UI can vary slightly; stick to accessible labels.
  await page.getByLabel(/email address|email/i).fill(email!);
  await page.getByRole("button", { name: /continue|sign in/i }).click();

  await page.getByLabel(/password/i).fill(password!);
  await page.getByRole("button", { name: /continue|sign in/i }).click();

  // After successful sign-in, the home header shows SignedIn actions.
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: /new challenge/i })).toBeVisible({
    timeout: 30_000,
  });
});
