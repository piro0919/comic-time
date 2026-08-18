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
 * 取得そのものの締め切り。
 * networkTimeoutSeconds は控えがあるときにしか効かず、一度も開いていないページは
 * 応答が返るまで待ち続けてしまう。打ち切って例外にし、オフライン画面へ落とす。
 */
const deadlinePlugin = {
  requestWillFetch: async ({
    request,
  }: {
    request: Request;
  }): Promise<Request> =>
    new Request(request, { signal: AbortSignal.timeout(8000) }),
};
/**
 * ページ取得はネットワーク優先。応答が返らない場所で固まらないよう、
 * 4秒で控えに切り替え、8秒で取得そのものを打ち切る。
 * その控えも1日で捨てる。前の日の一覧を今日のものとして見せないため。
 */
const pageCache = {
  handler: new NetworkFirst({
    cacheName: "pages",
    networkTimeoutSeconds: 4,
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 24 * 60 * 60, maxEntries: 16 }),
      deadlinePlugin,
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
  /**
   * ナビゲーションの先読みは切る。
   * 先読みが有る間は、その応答を待つ処理が締め切りより手前に入り、
   * 応答が返らないと待ち続けてしまう。速さより、止まらないことを取る。
   */
  navigationPreload: false,
  precacheEntries: self.__SW_MANIFEST,
  runtimeCaching: [pageCache, ...defaultCache],
  skipWaiting: true,
});

serwist.addEventListeners();
