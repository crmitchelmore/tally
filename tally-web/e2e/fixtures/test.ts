import { test as base, expect, Page } from "@playwright/test";

// Page Objects
export class LandingPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/");
  }

  async isVisible() {
    return this.page.locator("h1").isVisible();
  }

  get heroSection() {
    return this.page.locator("[data-testid=hero]");
  }

  get startTrackingButton() {
    return this.page.getByRole("link", { name: /start tracking/i });
  }

  get microDemo() {
    return this.page.locator("[data-testid=micro-demo]");
  }

  get incrementButton() {
    return this.page.locator("[data-testid=increment-button]");
  }
}

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/app");
  }

  async waitForLoad() {
    await this.page.waitForSelector("[data-testid=dashboard]", {
      timeout: 10000,
    });
  }

  get createChallengeButton() {
    return this.page.getByRole("button", { name: /create.*challenge/i });
  }

  get challengeCards() {
    return this.page.locator("[data-testid=challenge-card]");
  }

  getChallengeCard(name: string) {
    return this.page.locator(`[data-testid=challenge-card]:has-text("${name}")`);
  }

  getQuickAddButton(challengeName: string) {
    return this.getChallengeCard(challengeName).locator(
      "[data-testid=quick-add]"
    );
  }

  get emptyState() {
    return this.page.locator("[data-testid=empty-state]");
  }

  get syncStatus() {
    return this.page.locator("[data-testid=sync-status]");
  }

  get followingSection() {
    return this.page.locator("[data-testid=following-section]");
  }
}

export class ChallengeDetailPage {
  constructor(private page: Page) {}

  async goto(id: string) {
    await this.page.goto(`/app/challenges/${id}`);
  }

  get title() {
    return this.page.locator("[data-testid=challenge-title]");
  }

  get progressRing() {
    return this.page.locator("[data-testid=progress-ring]");
  }

  get paceStatus() {
    return this.page.locator("[data-testid=pace-status]");
  }

  get heatmap() {
    return this.page.locator("[data-testid=activity-heatmap]");
  }

  get editButton() {
    return this.page.getByRole("button", { name: /edit/i });
  }

  get deleteButton() {
    return this.page.getByRole("button", { name: /delete/i });
  }

  get archiveButton() {
    return this.page.getByRole("button", { name: /archive/i });
  }
}

export class ChallengeDialog {
  constructor(private page: Page) {}

  get dialog() {
    return this.page.locator("[data-testid=challenge-dialog]");
  }

  get nameInput() {
    return this.page.getByLabel(/name/i);
  }

  get targetInput() {
    return this.page.getByLabel(/target/i);
  }

  get timeframeSelect() {
    return this.page.getByLabel(/timeframe/i);
  }

  get publicToggle() {
    return this.page.getByLabel(/public/i);
  }

  get saveButton() {
    return this.page.getByRole("button", { name: /save|create/i });
  }

  get cancelButton() {
    return this.page.getByRole("button", { name: /cancel/i });
  }

  async fillChallenge(data: {
    name: string;
    target: number;
    timeframe?: string;
  }) {
    await this.nameInput.fill(data.name);
    await this.targetInput.fill(String(data.target));
    if (data.timeframe) {
      await this.timeframeSelect.selectOption(data.timeframe);
    }
  }
}

export class EntryDialog {
  constructor(private page: Page) {}

  get dialog() {
    return this.page.locator("[data-testid=entry-dialog]");
  }

  get countInput() {
    return this.page.getByLabel(/count|amount/i);
  }

  get dateInput() {
    return this.page.getByLabel(/date/i);
  }

  get noteInput() {
    return this.page.getByLabel(/note/i);
  }

  get addSetsButton() {
    return this.page.getByRole("button", { name: /add sets/i });
  }

  get addButton() {
    return this.page.getByRole("button", { name: /^add$/i });
  }

  async addEntry(count: number) {
    await this.countInput.fill(String(count));
    await this.addButton.click();
  }
}

export class CommunityPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/app/community");
  }

  get challengeList() {
    return this.page.locator("[data-testid=community-challenges]");
  }

  get searchInput() {
    return this.page.getByPlaceholder(/search/i);
  }

  getChallengeItem(name: string) {
    return this.page.locator(
      `[data-testid=community-challenge]:has-text("${name}")`
    );
  }

  getFollowButton(challengeName: string) {
    return this.getChallengeItem(challengeName).getByRole("button", {
      name: /follow/i,
    });
  }
}

// Fixtures
type TestFixtures = {
  landingPage: LandingPage;
  dashboardPage: DashboardPage;
  challengeDetailPage: ChallengeDetailPage;
  challengeDialog: ChallengeDialog;
  entryDialog: EntryDialog;
  communityPage: CommunityPage;
};

export const test = base.extend<TestFixtures>({
  landingPage: async ({ page }, use) => {
    await use(new LandingPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  challengeDetailPage: async ({ page }, use) => {
    await use(new ChallengeDetailPage(page));
  },
  challengeDialog: async ({ page }, use) => {
    await use(new ChallengeDialog(page));
  },
  entryDialog: async ({ page }, use) => {
    await use(new EntryDialog(page));
  },
  communityPage: async ({ page }, use) => {
    await use(new CommunityPage(page));
  },
});

export { expect };
