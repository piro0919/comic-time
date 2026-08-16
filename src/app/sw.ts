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
 * 既定のページ取得はネットワーク優先で、待ち時間の上限が無い。
 * 電波が悪く応答が返らない場所で固まるため、数秒でキャッシュに切り替える。
 * その控えも1日で捨てる。前の日の一覧を今日のものとして見せないため。
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
  navigationPreload: true,
  precacheEntries: self.__SW_MANIFEST,
  runtimeCaching: [pageCache, ...defaultCache],
  skipWaiting: true,
});

serwist.addEventListeners();
