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
 * Returns the environment-appropriate Clerk secret key.
 * Use getClerkSecretKey() directly instead of relying on process.env.CLERK_SECRET_KEY.
 * 
 * Note: We cannot safely assign to process.env in edge middleware due to webpack
 * compilation issues with secret redaction.
 */
export function ensureClerkSecretKeyEnv(): string | undefined {
  return getClerkSecretKey();
}

/**
 * Returns the environment-appropriate Clerk publishable key.
 * Use getClerkPublishableKey() directly instead of relying on process.env.
 * 
 * Note: We cannot safely assign to process.env in edge middleware due to webpack
 * compilation issues with secret redaction.
 */
export function ensureClerkPublishableKeyEnv(): string | undefined {
  return getClerkPublishableKey();
}
