// eslint-disable-next-line filenames/match-regex, filenames/match-exported
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

/**
 * データ更新のたびにビルドし直すので、ビルド単位でキャッシュを入れ替える。
 * コミットSHAが無い環境ではビルド時刻を使う（同日に二度ビルドしても入れ替わる）。
 */
const revision = process.env.VERCEL_GIT_COMMIT_SHA ?? `${Date.now()}`;
const withSerwist = withSerwistInit({
  // 曜日ページは分かれているため、オフラインでも全曜日を開けるよう先に取っておく
  additionalPrecacheEntries: [
    "/",
    "/day/sun",
    "/day/mon",
    "/day/tue",
    "/day/wed",
    "/day/thu",
    "/day/fri",
    "/day/sat",
  ].map((url) => ({ revision, url })),
  disable: process.env.NODE_ENV === "development",
  swDest: "public/sw.js",
  // eslint-disable-next-line write-good-comments/write-good-comments
  // Note: This is only an example. If you use Pages Router,
  // use something else that works, such as "service-worker/index.ts".
  swSrc: "src/app/sw.ts",
});
const nextConfig: NextConfig = withSerwist({
  /* config options here */
  experimental: {
    typedEnv: true,
    // typedRoutes: true,
  },
  images: {
    unoptimized: true,
  },
});

export default nextConfig;
