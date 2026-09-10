// eslint-disable-next-line filenames/match-regex, filenames/match-exported
import imageHosts from "./src/app/imageHosts";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // next dev が CLAUDE.md に自分の説明文を書き足すのを止める。あの指示は手で書いている
  agentRules: false,
  experimental: {
    typedEnv: true,
    // typedRoutes: true,
  },
  /**
   * 一覧に並ぶサムネイルは、各社の CDN が持っている原寸そのまま。
   * 1080x675 の絵を 177px の枠に出していて、1枚で 3MB 近くメモリを取る。
   * 枠に合う大きさへ縮めて渡す。sizes は各所ですでに書いてある。
   */
  images: {
    remotePatterns: imageHosts.map((hostname) => ({
      hostname,
      protocol: "https" as const,
    })),
  },
};

export default nextConfig;
