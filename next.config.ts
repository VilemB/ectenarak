import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false, // Explicitly set to false for webhook compatibility
  logging: false, // Disable all development logging
};

export default nextConfig;
