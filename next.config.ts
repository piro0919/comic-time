// eslint-disable-next-line filenames/match-regex, filenames/match-exported
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    typedEnv: true,
    // typedRoutes: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
