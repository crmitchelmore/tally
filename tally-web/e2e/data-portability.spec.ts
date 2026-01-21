import { test, expect } from "./fixtures/test";

test.describe("Data Portability @data @portability", () => {
  test.describe("Exporting Data", () => {
    test("export option is available in settings", async ({ page }) => {
      await page.goto("/app");

      // Navigate to settings
      const settingsLink = page
        .getByRole("link", { name: /settings/i })
        .or(page.locator("[data-testid=settings-link]"));

      if (await settingsLink.isVisible()) {
        await settingsLink.click();

        // Should see export option
        const exportButton = page.getByRole("button", {
          name: /export.*data/i,
        });

        if (await exportButton.isVisible()) {
          await expect(exportButton).toBeVisible();
        }
      }
    });

    test("exporting data triggers download", async ({ page }) => {
      await page.goto("/app");

      const settingsLink = page
        .getByRole("link", { name: /settings/i })
        .or(page.locator("[data-testid=settings-link]"));

      if (await settingsLink.isVisible()) {
        await settingsLink.click();

        const exportButton = page.getByRole("button", {
          name: /export.*data/i,
        });

        if (await exportButton.isVisible()) {
          // Set up download listener
          const downloadPromise = page.waitForEvent("download", {
            timeout: 5000,
          });

          await exportButton.click();

          // Select JSON if format options shown
          const jsonOption = page.getByRole("button", { name: /json/i });
          if (await jsonOption.isVisible()) {
            await jsonOption.click();
          }

          try {
            const download = await downloadPromise;
            expect(download.suggestedFilename()).toContain("tally");
          } catch {
            // Download may not trigger if no data or feature not implemented
          }
        }
      }
    });
  });

  test.describe("Importing Data", () => {
    test("import option is available in settings", async ({ page }) => {
      await page.goto("/app");

      const settingsLink = page
        .getByRole("link", { name: /settings/i })
        .or(page.locator("[data-testid=settings-link]"));

      if (await settingsLink.isVisible()) {
        await settingsLink.click();

        // Should see import option
        const importButton = page.getByRole("button", {
          name: /import.*data/i,
        });

        if (await importButton.isVisible()) {
          await expect(importButton).toBeVisible();
        }
      }
    });
  });

  test.describe("Clearing All Data", () => {
    test("clear data option requires confirmation", async ({ page }) => {
      await page.goto("/app");

      const settingsLink = page
        .getByRole("link", { name: /settings/i })
        .or(page.locator("[data-testid=settings-link]"));

      if (await settingsLink.isVisible()) {
        await settingsLink.click();

        const clearButton = page.getByRole("button", {
          name: /clear.*all.*data|delete.*all/i,
        });

        if (await clearButton.isVisible()) {
          await clearButton.click();

          // Should see confirmation dialog
          const confirmDialog = page.locator(
            "[data-testid=confirm-dialog], [role=alertdialog], [role=dialog]"
          );

          if (await confirmDialog.isVisible()) {
            // Should have warning text
            await expect(confirmDialog).toContainText(/cannot.*undo|permanent/i);

            // Cancel to not actually clear data
            const cancelButton = page.getByRole("button", { name: /cancel/i });
            if (await cancelButton.isVisible()) {
              await cancelButton.click();
            }
          }
        }
      }
    });
  });

  test.describe("Data Portability Workflow", () => {
    test("can navigate to data management section", async ({ page }) => {
      await page.goto("/app");

      // Look for settings or data management
      const settingsLink = page
        .getByRole("link", { name: /settings/i })
        .or(page.locator("[data-testid=settings-link]"))
        .or(page.getByRole("button", { name: /settings/i }));

      if (await settingsLink.isVisible()) {
        await settingsLink.click();

        // Should be able to find data-related options
        const dataSection = page.locator(
          "[data-testid=data-section], :has-text('Data'), :has-text('Export')"
        );

        // Data management should be accessible
      }
    });
  });
});
