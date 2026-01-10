import type { NextConfig } from "next";
import path from "path";
import { loadEnvConfig } from "@next/env";
import { withSentryConfig } from "@sentry/nextjs";

// Load root .env for local dev/build (Vercel uses its own env vars).
loadEnvConfig(path.resolve(__dirname, ".."), process.env.NODE_ENV !== "production");

const nextConfig: NextConfig = {
  /* config options here */
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
