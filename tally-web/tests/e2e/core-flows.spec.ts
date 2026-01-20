import { test, expect } from "@playwright/test";

const testEmail = process.env.TEST_USER_EMAIL;
const testPassword = process.env.TEST_USER_PASSWORD;
const hasClerkEnv = Boolean(
  process.env.CLERK_SECRET_KEY &&
    (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY)
);
const hasCredentials = Boolean(testEmail && testPassword);

async function clickPrimaryAction(page: Parameters<typeof test>[0]["page"]) {
  const submitButton = page.locator('button[type="submit"]');
  if (await submitButton.count()) {
    await submitButton.first().click();
    return;
  }
  const namedButton = page.getByRole("button", { name: /continue|sign in/i });
  if (await namedButton.count()) {
    await namedButton.first().click();
    return;
  }
  throw new Error("Unable to find Clerk sign-in submit button.");
}

async function signIn(page: Parameters<typeof test>[0]["page"]) {
  if (!testEmail || !testPassword) {
    throw new Error("Missing TEST_USER_EMAIL/TEST_USER_PASSWORD.");
  }
  await page.goto("/sign-in");
  if (page.url().includes("/app")) {
    return;
  }
  const identifier = page.locator(
    'input[name="identifier"], input[type="email"], input[autocomplete="username"]'
  );
  await identifier.first().waitFor({ state: "visible", timeout: 15_000 });
  await identifier.first().fill(testEmail);

  const password = page.locator('input[type="password"], input[name="password"]');
  if (!(await password.first().isVisible())) {
    await clickPrimaryAction(page);
  }
  await password.first().waitFor({ state: "visible", timeout: 15_000 });
  await password.first().fill(testPassword);
  await clickPrimaryAction(page);
  await page.waitForURL("**/app", { timeout: 30_000 });
}

async function clearData(page: Parameters<typeof test>[0]["page"]) {
  const response = await page.request.post("/api/v1/data/clear");
  expect(response.ok()).toBeTruthy();
}

async function waitForLoad(page: Parameters<typeof test>[0]["page"]) {
  const loading = page.getByText("Loading entries...");
  if (await loading.count()) {
    await expect(loading).toBeHidden();
  }
}

test.describe("core flows", () => {
  test.skip(
    !hasClerkEnv || !hasCredentials,
    "Missing Clerk keys or test credentials for E2E sign-in."
  );

  test(
    "create challenge, log entry, export and import data",
    async ({ page }, testInfo) => {
      test.setTimeout(120_000);

      await signIn(page);
      await clearData(page);
      await page.goto("/app");
      await waitForLoad(page);

      const challengeName = `Playwright challenge ${Date.now()}`;
      await page.getByRole("button", { name: "New challenge" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.getByLabel("Challenge name").fill(challengeName);
      await page.getByLabel("Challenge target number").fill("12");
      await page.getByLabel("Challenge color").fill("#b21f24");
      await page.getByRole("button", { name: "Create challenge" }).click();
      await expect(page.getByRole("dialog")).toBeHidden();

      await page.getByRole("button", { name: "Add entry" }).click();
      await page.getByLabel("Entry challenge").selectOption({ label: challengeName });
      await page.getByLabel("Entry count").fill("3");
      await page.getByLabel("Entry note").fill("Playwright entry");
      await page.getByRole("button", { name: "Easy" }).click();
      await page.getByRole("button", { name: "Save entry" }).click();

      await page.getByRole("button", { name: "Overview" }).click();
      await expect(page.getByText("Playwright entry")).toBeVisible();

      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "Export JSON" }).click(),
      ]);
      const exportPath = testInfo.outputPath("tally-backup.json");
      await download.saveAs(exportPath);

      await page.getByLabel("Import backup file").setInputFiles(exportPath);
      await expect(page.getByText("Replace all data?")).toBeVisible();
      await page.getByRole("button", { name: "Replace data" }).click();
      await expect(
        page.getByText("Import complete. All existing data was replaced.")
      ).toBeVisible();
    }
  );
});
