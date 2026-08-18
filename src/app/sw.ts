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

/** 同一サイトの、API 以外への取得か */
function isSitePath({
  sameOrigin,
  url: { pathname },
}: {
  sameOrigin: boolean;
  url: URL;
}): boolean {
  return sameOrigin && !pathname.startsWith("/api/");
}

/**
 * 画面そのものの控え。ネットワーク優先で、遅いときは4秒で控えに切り替える。
 * 控えの無いページは遅くても待つ。通信できているのにオフライン画面を
 * 出す方が困るため、打ち切りは設けない。
 * 控えは1日で捨てる。前の日の一覧を今日のものとして見せないため。
 */
const documentCache = {
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
    url,
  }: {
    request: Request;
    sameOrigin: boolean;
    url: URL;
  }): boolean => isSitePath({ sameOrigin, url }) && request.mode === "navigate",
};
/**
 * 画面内での移動に使う応答。枠を画面そのものと分ける。
 * 同じ枠に入れると、1ページ開くたびに8件ほど積まれ、
 * 画面の控えが数ページで押し出されてしまう。
 */
const rscCache = {
  handler: new NetworkFirst({
    cacheName: "rsc",
    networkTimeoutSeconds: 4,
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 24 * 60 * 60, maxEntries: 48 }),
    ],
  }),
  matcher: ({
    request,
    sameOrigin,
    url,
  }: {
    request: Request;
    sameOrigin: boolean;
    url: URL;
  }): boolean =>
    isSitePath({ sameOrigin, url }) && request.headers.get("RSC") === "1",
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
  runtimeCaching: [documentCache, rscCache, ...defaultCache],
  skipWaiting: true,
});

serwist.addEventListeners();
