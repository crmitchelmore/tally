import type { AuthConfig } from "convex/server";
// Set CLERK_JWT_ISSUER_DOMAIN on isolated deployments only. Preserve the
// established production issuer when no override is configured.
const issuer = process.env.CLERK_JWT_ISSUER_DOMAIN || "https://clerk.tally-tracker.app";
if (!/^https:\/\/[^/]+\/?$/.test(issuer)) {
  throw new Error("CLERK_JWT_ISSUER_DOMAIN must be an HTTPS origin");
}
const issuerOrigin = issuer.replace(/\/$/, "");
export default {
  providers: [{
    type: "customJwt",
    issuer: issuerOrigin,
    jwks: `${issuerOrigin}/.well-known/jwks.json`,
    algorithm: "RS256",
    // Clerk session JWTs have no aud. This issuer belongs exclusively to Tally.
  }],
} satisfies AuthConfig;
