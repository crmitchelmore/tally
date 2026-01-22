/**
 * Authentication fixtures for E2E tests against dev Convex instance
 * 
 * These fixtures handle:
 * 1. Logging in with Clerk using email/password
 * 2. Persisting auth state across tests
 * 3. Running tests against the dev Convex backend
 */
import { test as base, expect, Page, BrowserContext } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_STATE_PATH = path.join(__dirname, "../../.auth-state.json");

// Test credentials from environment
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

/**
 * Perform Clerk login with email/password (native Clerk auth, not OAuth)
 */
async function loginWithClerk(page: Page): Promise<void> {
  if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
    throw new Error("TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in environment");
  }

  await page.goto("/sign-in");
  
  // Wait for Clerk sign-in form to load
  await page.waitForTimeout(2000);
  
  // Check if we got redirected to Google OAuth (means user was created with Google)
  if (page.url().includes("accounts.google.com")) {
    throw new Error(
      "Test user appears to use Google OAuth. Please create a test user with email/password in Clerk dashboard."
    );
  }
  
  // Look for email input field on Clerk's form
  const emailInput = page.locator('input[name="identifier"], input[type="email"]').first();
  await emailInput.waitFor({ state: "visible", timeout: 10000 });
  await emailInput.fill(TEST_USER_EMAIL);
  
  // Click continue button
  const continueButton = page.getByRole("button", { name: /continue/i }).first();
  await continueButton.click();
  
  // Wait for next step
  await page.waitForTimeout(1500);
  
  // Check again if redirected to Google OAuth
  if (page.url().includes("accounts.google.com")) {
    throw new Error(
      "Test user appears to use Google OAuth. Please create a test user with email/password in Clerk dashboard."
    );
  }
  
  // Should now see password field for native Clerk auth
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.waitFor({ state: "visible", timeout: 10000 });
  await passwordInput.fill(TEST_USER_PASSWORD);
  
  // Click continue/sign in button  
  const signInButton = page.getByRole("button", { name: /continue|sign in/i }).first();
  await signInButton.click();
  
  // Wait for redirect to app
  await page.waitForURL(/\/app/, { timeout: 30000 });
}

/**
 * Check if we have valid auth state
 */
function hasValidAuthState(): boolean {
  if (!fs.existsSync(AUTH_STATE_PATH)) {
    return false;
  }
  
  try {
    const state = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, "utf-8"));
    // Check if state is less than 24 hours old
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return state.timestamp && state.timestamp > oneDayAgo;
  } catch {
    return false;
  }
}

/**
 * Save auth state for reuse
 */
export async function saveAuthState(context: BrowserContext): Promise<void> {
  const state = await context.storageState();
  const stateWithTimestamp = {
    ...state,
    timestamp: Date.now(),
  };
  fs.writeFileSync(AUTH_STATE_PATH, JSON.stringify(stateWithTimestamp, null, 2));
}

/**
 * Load saved auth state
 */
function loadAuthState(): { cookies: any[]; origins: any[] } | null {
  if (!hasValidAuthState()) {
    return null;
  }
  
  try {
    const state = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, "utf-8"));
    return { cookies: state.cookies, origins: state.origins };
  } catch {
    return null;
  }
}

// Authenticated test fixture
export const authenticatedTest = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ browser }, use) => {
    // Try to use existing auth state
    const savedState = loadAuthState();
    
    let context: BrowserContext;
    let page: Page;
    
    if (savedState) {
      // Create context with saved auth state
      context = await browser.newContext({ storageState: savedState as any });
      page = await context.newPage();
      
      // Verify auth is still valid
      await page.goto("/app");
      await page.waitForTimeout(2000);
      
      // If redirected to sign-in, auth expired
      if (page.url().includes("sign-in")) {
        await context.close();
        // Fall through to fresh login
      } else {
        // Auth is valid
        await use(page);
        await context.close();
        return;
      }
    }
    
    // Need fresh login
    context = await browser.newContext();
    page = await context.newPage();
    
    await loginWithClerk(page);
    
    // Save auth state for future tests
    await saveAuthState(context);
    
    await use(page);
    await context.close();
  },
});

export { expect };
