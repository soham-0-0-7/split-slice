import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // explicitly point outputFileTracingRoot to this package folder so Next doesn't infer the wrong workspace root
  outputFileTracingRoot: path.join(__dirname),
  // keep strict mode off in development to avoid double renders that can cause noise
  reactStrictMode: false,
  // typescript: {
  //   // ❌ DON'T DO THIS LONG TERM — only to bypass type errors temporarily
  //   ignoreBuildErrors: true,
  // },
  // eslint: {
  //   // ✅ disables ESLint blocking builds
  //   ignoreDuringBuilds: true,
  // },
};

export default nextConfig;
