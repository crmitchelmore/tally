import type { NextConfig } from "next";
import path from "path";
import { loadEnvConfig } from "@next/env";

// Load root .env for local dev/build (Vercel uses its own env vars).
loadEnvConfig(path.resolve(__dirname, ".."), process.env.NODE_ENV !== "production");

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
