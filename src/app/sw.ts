import { defaultCache } from "@serwist/next/worker";
import {
  ExpirationPlugin,
  NetworkFirst,
  type PrecacheEntry,
  Serwist,
  type SerwistGlobalConfig,
} from "serwist";

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Change this attribute's name to your `injectionPoint`.
    // `injectionPoint` is an InjectManifest option.
    // See https://serwist.pages.dev/docs/build/configuring
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * ページ取得はネットワーク優先。応答が遅いときは4秒で控えに切り替える。
 * ただし控えが無いページは、遅くても待つ。通信できているのに
 * オフライン画面を出す方が困るため、打ち切りは設けない。
 * 控えは1日で捨てる。前の日の一覧を今日のものとして見せないため。
 */
const pageCache = {
  handler: new NetworkFirst({
    cacheName: "pages",
    networkTimeoutSeconds: 4,
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 24 * 60 * 60, maxEntries: 16 }),
    ],
  }),
  matcher: ({
    request,
    sameOrigin,
    url: { pathname },
  }: {
    request: Request;
    sameOrigin: boolean;
    url: URL;
  }): boolean =>
    sameOrigin &&
    !pathname.startsWith("/api/") &&
    (request.mode === "navigate" || request.headers.get("RSC") === "1"),
};
const serwist = new Serwist({
  clientsClaim: true,
  /**
   * 控えも無く、通信も駄目なときに出す画面。
   * ページの読み込みだけを差し替える。画像や JSON はそのまま失敗させる。
   */
  fallbacks: {
    entries: [
      {
        matcher: ({ request }): boolean => request.destination === "document",
        url: "/~offline",
      },
    ],
  },
  navigationPreload: true,
  precacheEntries: self.__SW_MANIFEST,
  runtimeCaching: [pageCache, ...defaultCache],
  skipWaiting: true,
});

serwist.addEventListeners();
