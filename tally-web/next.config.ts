import type { NextConfig } from "next";
import path from "path";
import { loadEnvConfig } from "@next/env";
import { withSentryConfig } from "@sentry/nextjs";

// Load root .env for local dev/build (Vercel uses its own env vars).
loadEnvConfig(path.resolve(__dirname, ".."), process.env.NODE_ENV !== "production");

const nextConfig: NextConfig = {
  // Security headers
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Note: CSP is enforced via middleware in proxy.ts
          // Report-only was removed as it caused console warnings without a report-to endpoint
        ],
      },
    ];
  },
};

// Sentry configuration for source maps and release tracking
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: process.env.SENTRY_ORG || "tally-lz",
  project: process.env.SENTRY_PROJECT || "javascript-nextjs",

  // Only upload source maps in production builds with auth token
  silent: !process.env.SENTRY_AUTH_TOKEN,
  
  // Upload source maps in CI/production only
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },

  // Hide source maps from browser devtools in production
  hideSourceMaps: true,

  // Webpack-specific options
  webpack: {
    // Tree-shake Sentry logger statements to reduce bundle size
    treeshake: {
      removeDebugLogging: true,
    },
    // Annotate React components for better breadcrumbs
    reactComponentAnnotation: {
      enabled: true,
    },
  },

  // Tunnel route to bypass ad blockers (optional)
  // tunnelRoute: "/monitoring",
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
