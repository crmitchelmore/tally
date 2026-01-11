export function isVercelProduction() {
  return process.env.VERCEL_ENV === "production";
}

export function getClerkPublishableKey(): string | undefined {
  const isProd = isVercelProduction();
  return isProd
    ? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_PROD ??
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV
    : process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV ??
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_PROD;
}
