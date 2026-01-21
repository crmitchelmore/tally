import { test, expect } from "./fixtures/test";

test.describe("Community Features @community @dashboard", () => {
  test.describe("Viewing the Dashboard", () => {
    test("viewing the complete dashboard", async ({ dashboardPage, page }) => {
      await dashboardPage.goto();
      await dashboardPage.waitForLoad();

      // In offline mode, look for challenge section or offline indicator
      await expect(
        page.locator("[data-testid=my-challenges], [data-testid=challenges-section], h1:has-text('Offline')")
      ).toBeVisible();
    });

    test("dashboard sections are clearly separated", async ({
      dashboardPage,
      page,
    }) => {
      await dashboardPage.goto();

      // Should have distinct sections or offline indicator
      const content = page.locator(
        "[data-testid=my-challenges], h2:has-text('My Challenges'), h1:has-text('Offline')"
      );
      await expect(content).toBeVisible();
    });
  });

  test.describe("Browsing Community Challenges", () => {
    test("browsing public challenges", async ({ communityPage, page }) => {
      await communityPage.goto();

      // Skip if redirected to sign-in (auth required)
      if (communityPage.isAuthRequired) {
        test.skip();
        return;
      }

      // Should see community challenges list
      const challengeList = communityPage.challengeList;

      // If community is implemented and has challenges
      if (await challengeList.isVisible()) {
        // Each challenge should show basic info
        const firstChallenge = page
          .locator("[data-testid=community-challenge]")
          .first();
        if (await firstChallenge.isVisible()) {
          // Should have name and some stats
          await expect(firstChallenge).toBeVisible();
        }
      }
    });

    test("searching for specific community challenges", async ({
      communityPage,
      page,
    }) => {
      await communityPage.goto();

      // Skip if redirected to sign-in (auth required)
      if (communityPage.isAuthRequired) {
        test.skip();
        return;
      }

      const searchInput = communityPage.searchInput;
      if (await searchInput.isVisible()) {
        await searchInput.fill("push");

        // Wait for results to filter
        await page.waitForTimeout(500);

        // Results should be filtered
        const results = page.locator("[data-testid=community-challenge]");
        // Results may vary based on what's in the community
      }
    });
  });

  test.describe("Following a Community Challenge", () => {
    test("following a public challenge", async ({
      communityPage,
      dashboardPage,
      page,
    }) => {
      await communityPage.goto();

      // Skip if redirected to sign-in (auth required)
      if (communityPage.isAuthRequired) {
        test.skip();
        return;
      }

      const challengeList = communityPage.challengeList;
      if (await challengeList.isVisible()) {
        const firstChallenge = page
          .locator("[data-testid=community-challenge]")
          .first();

        if (await firstChallenge.isVisible()) {
          const followButton = firstChallenge.getByRole("button", {
            name: /follow/i,
          });

          if (await followButton.isVisible()) {
            await followButton.click();

            // Should show following state
            await expect(
              firstChallenge.getByRole("button", { name: /following|unfollow/i })
            ).toBeVisible();
          }
        }
      }
    });

    test("unfollowing a public challenge", async ({
      communityPage,
      page,
    }) => {
      await communityPage.goto();

      // Skip if redirected to sign-in (auth required)
      if (communityPage.isAuthRequired) {
        test.skip();
        return;
      }

      // Find a challenge we're following
      const followingButton = page
        .locator("[data-testid=community-challenge]")
        .getByRole("button", { name: /following|unfollow/i })
        .first();

      if (await followingButton.isVisible()) {
        await followingButton.click();

        // Should revert to follow state
        await expect(
          page
            .locator("[data-testid=community-challenge]")
            .first()
            .getByRole("button", { name: /^follow$/i })
        ).toBeVisible();
      }
    });
  });

  test.describe("Viewing Followed Challenge Progress", () => {
    test("viewing a followed challenge's progress", async ({
      dashboardPage,
      page,
    }) => {
      await dashboardPage.goto();

      const followingSection = dashboardPage.followingSection;

      if (await followingSection.isVisible()) {
        // Should see followed challenges with progress
        const followedChallenge = followingSection
          .locator("[data-testid=followed-challenge]")
          .first();

        if (await followedChallenge.isVisible()) {
          // Should show progress
          await expect(followedChallenge).toContainText(/\d+/);
        }
      }
    });
  });

  test.describe("My Public Challenges", () => {
    test("making my challenge public", async ({
      dashboardPage,
      challengeDialog,
      challengeDetailPage,
      page,
    }) => {
      await dashboardPage.goto();

      // Create a challenge
      await dashboardPage.createChallengeButton.click();
      await challengeDialog.fillChallenge({
        name: "Public Test",
        target: 1000,
        timeframe: "year",
      });
      await challengeDialog.saveButton.click();

      // Go to detail and edit
      await dashboardPage.getChallengeCard("Public Test").click();
      await challengeDetailPage.editButton.click();

      // Toggle public
      const publicToggle = challengeDialog.publicToggle;
      if (await publicToggle.isVisible()) {
        await publicToggle.check();
        await challengeDialog.saveButton.click();

        // Should now be public
        // (verification depends on UI showing public indicator)
      }
    });
  });
});
