import type { AuthConfig } from "convex/server";
export default {
  providers: [{
    type: "customJwt",
    issuer: "https://clerk.tally-tracker.app",
    jwks: "https://clerk.tally-tracker.app/.well-known/jwks.json",
    algorithm: "RS256",
    // Clerk session JWTs have no aud. This issuer belongs exclusively to Tally.
  }],
} satisfies AuthConfig;
