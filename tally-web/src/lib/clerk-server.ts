export function getClerkSecretKey(): string | undefined {
  const isProd = process.env.VERCEL_ENV === "production";
  return isProd
    ? process.env.CLERK_SECRET_KEY_PROD ?? process.env.CLERK_SECRET_KEY
    : process.env.CLERK_SECRET_KEY_DEV ?? process.env.CLERK_SECRET_KEY;
}

export function ensureClerkSecretKeyEnv(): string | undefined {
  const key = getClerkSecretKey();
  if (key && !process.env.CLERK_SECRET_KEY) process.env.CLERK_SECRET_KEY = key;
  return key;
}
