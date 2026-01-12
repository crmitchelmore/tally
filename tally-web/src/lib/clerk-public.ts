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
 * Get the Clerk publishable key based on environment.
 * Works in both server and client contexts.
 *
 * Server: Uses VERCEL_ENV to pick _PROD or _DEV key
 * Client: Checks for keys in order: _PROD, _DEV, legacy
 */
export function getClerkPublishableKey(): string | undefined {
  // Server-side: use VERCEL_ENV to determine environment
  if (typeof process.env.VERCEL_ENV === "string") {
    const isProd = process.env.VERCEL_ENV === "production";
    return isProd
      ? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_PROD ??
          process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      : process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV ??
          process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  }

  // Client-side: return whichever key is available
  // The correct key will have been baked in at build time based on env
  return (
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_PROD ??
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV ??
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  );
}
