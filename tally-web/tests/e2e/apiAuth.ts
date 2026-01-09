export function getApiBaseUrl(): string {
  const explicit = process.env.E2E_API_BASE_URL;
  if (explicit) return explicit;

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) throw new Error("Missing NEXT_PUBLIC_CONVEX_URL (or E2E_API_BASE_URL)");

  return convexUrl.replace(".convex.cloud", ".convex.site");
}
