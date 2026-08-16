// eslint-disable-next-line filenames/match-regex, filenames/match-exported
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

/**
 * ページは先に取っておかない。中身が1日に何度も入れ替わるため、
 * 古いものを抱えて出す方が困る。開いたページだけを控えとして持つ。
 */
const withSerwist = withSerwistInit({
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
