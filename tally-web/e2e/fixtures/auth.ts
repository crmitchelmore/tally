/**
 * Authentication fixtures for E2E tests against dev Convex instance
 * 
 * These fixtures handle:
 * 1. Logging in with Clerk using email/password
 * 2. Persisting auth state across tests
 * 3. Running tests against the dev Convex backend
 */
import { test as base, expect, Page, BrowserContext, BrowserContextOptions } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_STATE_PATH = path.join(__dirname, "../../.auth-state.json");

// Auth state TTL - configurable via env, defaults to 24 hours
const AUTH_STATE_TTL_MS = parseInt(process.env.AUTH_STATE_TTL_HOURS || "24", 10) * 60 * 60 * 1000;

// Test credentials from environment
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

// Type for storage state with timestamp
type StorageStateInput = NonNullable<BrowserContextOptions["storageState"]>;
interface TimedStorageState {
  timestamp: number;
  cookies: Array<{ name: string; value: string; domain: string; path: string }>;
  origins: Array<{ origin: string; localStorage: Array<{ name: string; value: string }> }>;
}

/**
 * Perform Clerk login with email/password (native Clerk auth, not OAuth)
 */
async function loginWithClerk(page: Page): Promise<void> {
  if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
    throw new Error("TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in environment");
  }

  await page.goto("/sign-in");
  
  // Check if we got immediately redirected to Google OAuth
  if (page.url().includes("accounts.google.com")) {
    throw new Error(
      "Clerk immediately redirected to Google OAuth. " +
      "Enable email+password in Clerk Dashboard."
    );
  }
  
  // Look for email input field on Clerk's form
  const emailInput = page.locator('input[name="identifier"], input[type="email"]').first();
  await emailInput.waitFor({ state: "visible", timeout: 10000 });
  await emailInput.fill(TEST_USER_EMAIL);
  
  // Click the "Continue" button (NOT "Continue with Google")
  // Use exact match to avoid matching OAuth buttons
  const continueButton = page.getByRole("button", { name: "Continue", exact: true });
  await continueButton.waitFor({ state: "visible", timeout: 5000 });
  await continueButton.click();
  
  // Wait for password field to appear (replaces waitForTimeout)
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.waitFor({ state: "visible", timeout: 10000 });
  
  // Check if redirected to Google OAuth after entering email
  if (page.url().includes("accounts.google.com")) {
    throw new Error(
      "Clerk redirected to Google OAuth after entering email. " +
      "The user may have been created via Google OAuth. " +
      "Create a new user with email+password auth, not Google."
    );
  }
  
  await passwordInput.fill(TEST_USER_PASSWORD);
  
  // Click continue/sign in button  
  const signInButton = page.getByRole("button", { name: "Continue", exact: true });
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
    const state = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, "utf-8")) as TimedStorageState;
    const expiryThreshold = Date.now() - AUTH_STATE_TTL_MS;
    return state.timestamp && state.timestamp > expiryThreshold;
  } catch {
    return false;
  }
}

/**
 * Save auth state for reuse
 */
async function saveAuthState(context: BrowserContext): Promise<void> {
  const storageState = await context.storageState();
  fs.writeFileSync(
    AUTH_STATE_PATH,
    JSON.stringify({
      timestamp: Date.now(),
      ...storageState,
    })
  );
}

/**
 * Load saved auth state
 */
function loadAuthState(): StorageStateInput | null {
  if (!hasValidAuthState()) {
    return null;
  }
  
  try {
    const state = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, "utf-8")) as TimedStorageState;
    const { timestamp: _, ...storageState } = state;
    return storageState as StorageStateInput;
  } catch {
    return null;
  }
}

// Extend base test with authenticated fixtures
export const test = base.extend<{
  authenticatedPage: Page;
  authenticatedContext: BrowserContext;
}>({
  authenticatedContext: async ({ browser }, use) => {
    // Try to reuse existing auth state
    const existingState = loadAuthState();
    
    const context = existingState 
      ? await browser.newContext({ storageState: existingState })
      : await browser.newContext();
    
    await use(context);
    await context.close();
  },
  
  authenticatedPage: async ({ authenticatedContext }, use) => {
    const page = await authenticatedContext.newPage();
    
    // Check if we need to login
    await page.goto("/app");
    // Wait for either redirect or content to load
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000); // Brief pause for client-side routing
    
    // Check if we need to authenticate:
    // 1. Redirected to sign-in page
    // 2. OR see "Sign in" button in header (app allows unauthenticated access)
    const needsAuth = page.url().includes("/sign-in") || 
      await page.getByRole("button", { name: "Sign in" }).isVisible().catch(() => false);
    
    if (needsAuth) {
      console.log("Auth required - logging in with Clerk...");
      await page.goto("/sign-in");
      await loginWithClerk(page);
      await saveAuthState(authenticatedContext);
    }
    
    // Verify we're authenticated - should NOT see "Sign in" button
    await page.goto("/app");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    const signInButton = page.getByRole("button", { name: "Sign in" });
    const stillNeedsAuth = await signInButton.isVisible().catch(() => false);
    if (stillNeedsAuth) {
      throw new Error("Authentication failed - Sign in button still visible after login");
    }
    
    await use(page);
  },
});

export { expect };

// Export as authenticatedTest for backward compatibility
export const authenticatedTest = test;
