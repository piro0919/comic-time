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
    /**
     * 変換した絵をどれだけ持っておくか。Vercel は「変換」を作り直すたびに数える。
     *
     * 既定は4時間で、取得元の Cache-Control に従う。ところが16の取得先のうち9つは
     * Cache-Control を返さず、1つは1時間しか持たせない。既定のままだと同じ絵を
     * 1日6回作り直すことになり、月100万回に届く。サムネイルの住所は版が変わると
     * 変わるので、長く持っても古い絵が出続けることにはならない。
     */
    minimumCacheTTL: 60 * 60 * 24 * 31,
    /**
     * 使ってよい画質。ここに無い値を渡すと画像が 400 で返る。
     * サムネイルは 60 で出す。177px の枠では 75 との差が見て分からず、
     * 1枚あたり 25.9KB が 22.5KB になる。
     * 75 も残すのは、印や見出しの小さな絵が既定値のままだから。
     */
    qualities: [60, 75],
    remotePatterns: imageHosts.map((hostname) => ({
      hostname,
      protocol: "https" as const,
    })),
  },
};

export default nextConfig;
