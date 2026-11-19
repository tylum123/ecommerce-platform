import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep verification builds separate from any running default preview.
  distDir: process.env.NARI_ISOLATED_BUILD === "1" ? "build/verification" : ".next",
  output: "standalone",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
