/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
  env: {
    // Override CLERK_PROXY_URL to empty string to disable proxy
    // (Vercel may have this set with a trailing newline causing issues)
    CLERK_PROXY_URL: "",
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Proxy clerk.tally-tracker.app/* to Clerk's frontend API
        {
          source: "/:path*",
          has: [{ type: "host", value: "clerk.tally-tracker.app" }],
          destination: "https://frontend-api.clerk.services/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
