import { getClerkPublishableKey } from "./clerk-public";

/**
 * Returns the appropriate Clerk secret key based on the deployment environment.
 *
 * In production:  Prefers PROD key → base key (never falls back to DEV)
 * In development: Prefers DEV key → base key (never falls back to PROD)
 */
export function getClerkSecretKey(): string | undefined {
  const isProd = process.env.VERCEL_ENV === "production";
  return isProd
    ? process.env.CLERK_SECRET_KEY_PROD ?? process.env.CLERK_SECRET_KEY
    : process.env.CLERK_SECRET_KEY_DEV ?? process.env.CLERK_SECRET_KEY;
}

/**
 * Ensures CLERK_SECRET_KEY is set in process.env for libraries that read it directly.
 * Always overrides to ensure the environment-appropriate key is used.
 */
export function ensureClerkSecretKeyEnv(): string | undefined {
  const key = getClerkSecretKey();
  if (key) process.env.CLERK_SECRET_KEY = key;
  return key;
}

/**
 * Ensures NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set in process.env for libraries
 * that read it directly (like @clerk/nextjs middleware).
 * Must be called server-side before Clerk middleware initializes.
 */
export function ensureClerkPublishableKeyEnv(): string | undefined {
  const key = getClerkPublishableKey();
  if (key) process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = key;
  return key;
}
