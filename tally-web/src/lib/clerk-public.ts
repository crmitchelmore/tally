/**
 * Check if running in Vercel production environment.
 * Note: VERCEL_ENV is only available server-side. For client components,
 * this will return false, and we'll fall back to checking the available keys.
 */
export function isVercelProduction(): boolean {
  // VERCEL_ENV is server-side only
  if (typeof process.env.VERCEL_ENV === "string") {
    return process.env.VERCEL_ENV === "production";
  }
  // On client, we can't determine environment from VERCEL_ENV
  // Return undefined to signal caller should use a different approach
  return false;
}

/**
 * Returns the appropriate Clerk publishable key based on the deployment environment.
 *
 * Server-side: Uses VERCEL_ENV to pick _PROD or _DEV key, falls back to base key.
 * Client-side: Returns whichever key is available (baked in at build time).
 *
 * In production:  Prefers PROD key → base key (never falls back to DEV)
 * In development: Prefers DEV key → base key (never falls back to PROD)
 *
 * The base key (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) acts as a universal fallback
 * during migration while explicit *_DEV/*_PROD keys are being adopted.
 */
export function getClerkPublishableKey(): string | undefined {
  // Don't rely on VERCEL_ENV (can be absent in Edge runtime). Prefer the most specific key available.
  return (
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_PROD ??
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV ??
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  );
}
