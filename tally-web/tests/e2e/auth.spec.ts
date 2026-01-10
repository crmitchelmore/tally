import { test, expect } from "@playwright/test";
import { getApiBaseUrl } from "./apiAuth";

test("@auth sign-in shows signed-in UI", async ({ page, request }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  test.skip(!email || !password, "Missing TEST_USER_EMAIL/TEST_USER_PASSWORD");

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

  const token = await page.evaluate(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clerk = (window as any).Clerk;
    if (!clerk?.session) return null;

    try {
      return await clerk.session.getToken({ template: "convex" });
    } catch {
      return await clerk.session.getToken();
    }
  });

  expect(token).toBeTruthy();

  const apiBase = getApiBaseUrl();

  const unauthorized = await request.get(`${apiBase}/api/challenges`);
  expect(unauthorized.status()).toBe(401);

  const res = await request.get(`${apiBase}/api/challenges`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  expect(res.ok()).toBeTruthy();
  await expect(res.json()).resolves.toBeInstanceOf(Array);
});
