// eslint-disable-next-line filenames/match-regex, filenames/match-exported
import withSerwistInit, { type PluginOptions } from "@serwist/next";
import type { NextConfig } from "next";

/** オフライン画面の版。ビルドのたびに変え、古い控えを捨てさせる */
const offlineRevision = Date.now().toString(36);

/**
 * App Router のページは既定の一覧に入らない。
 * オフライン画面だけは前もって控えておかないと、いざというときに出せない。
 */
type ManifestTransform = NonNullable<
  PluginOptions["manifestTransforms"]
>[number];
type ManifestTransformResult = Awaited<ReturnType<ManifestTransform>>;

const manifestTransforms: ManifestTransform[] = [
  async (entries): Promise<ManifestTransformResult> => ({
    manifest: [
      ...entries,
      { revision: offlineRevision, size: 0, url: "/~offline" },
    ],
    warnings: [],
  }),
];
/**
 * ページは先に取っておかない。中身が1日に何度も入れ替わるため、
 * 古いものを抱えて出す方が困る。開いたページだけを控えとして持つ。
 */
const isDevelopment = process.env.NODE_ENV === "development";
const withSerwist = withSerwistInit({
  disable: isDevelopment,
  manifestTransforms,
  swDest: "public/sw.js",
  // eslint-disable-next-line write-good-comments/write-good-comments
  // Note: This is only an example. If you use Pages Router,
  // use something else that works, such as "service-worker/index.ts".
  swSrc: "src/app/sw.ts",
});
const baseConfig: NextConfig = {
  /* config options here */
  experimental: {
    typedEnv: true,
    // typedRoutes: true,
  },
  images: {
    unoptimized: true,
  },
};
/**
 * 開発中は Serwist を止めている。それでも包むと webpack の設定だけが残り、
 * Turbopack で動かしたときに設定の食い違いとして警告が出る。だから包まない。
 */
const nextConfig: NextConfig = isDevelopment
  ? baseConfig
  : withSerwist(baseConfig);

export default nextConfig;
