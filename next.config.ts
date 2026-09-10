// eslint-disable-next-line filenames/match-regex, filenames/match-exported
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // next dev が CLAUDE.md に自分の説明文を書き足すのを止める。あの指示は手で書いている
  agentRules: false,
  experimental: {
    typedEnv: true,
    // typedRoutes: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
