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
          // CSP in report-only mode first to avoid breaking things
          // Move to Content-Security-Policy after validation
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              // Scripts: self + Clerk + analytics
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.dev https://challenges.cloudflare.com https://app.posthog.com https://app.launchdarkly.com",
              // Styles: self + inline (Tailwind/shadcn)
              "style-src 'self' 'unsafe-inline'",
              // Images: self + data URIs + Clerk avatars + common CDNs
              "img-src 'self' data: blob: https://*.clerk.com https://*.clerk.dev https://img.clerk.com https://images.clerk.dev",
              // Fonts: self + common font CDNs
              "font-src 'self' data:",
              // Connect: APIs + Clerk + Convex + analytics
              "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com https://*.convex.cloud https://*.convex.site https://app.posthog.com https://events.launchdarkly.com https://*.sentry.io https://otlp-gateway-prod-gb-south-1.grafana.net wss://*.convex.cloud",
              // Frames: Clerk popups + Cloudflare turnstile
              "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.dev https://challenges.cloudflare.com",
              // Workers for service workers
              "worker-src 'self' blob:",
              // Object/base/form
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              // Upgrade insecure requests in production
              process.env.NODE_ENV === "production" ? "upgrade-insecure-requests" : "",
            ].filter(Boolean).join("; "),
          },
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
