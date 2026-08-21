import { defaultCache } from "@serwist/next/worker";
import {
  ExpirationPlugin,
  NetworkFirst,
  type PrecacheEntry,
  Serwist,
  type SerwistGlobalConfig,
  type StrategyHandler,
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

/** 何回目の再試行かに応じて、次を試すまでに待つ時間 */
const retryDelaysMs = [400, 900];

/**
 * 一度の失敗で諦めない取得。
 *
 * アプリを立ち上げた直後は、まだ通信が使える状態になっていないことがある。
 * そのとき取得は待たされるのではなく即座に失敗するため、繋がっているのに
 * オフライン画面が出る。間を置いて試し直せば、その頃には通信が立ち上がっている。
 *
 * 長くは粘れない。圏外のまま2秒ほど返さずにいると、ブラウザが画面の移動
 * そのものを取り消してしまう。最後の試みは1.3秒あたりに置く。
 */
class RetryingNetworkFirst extends NetworkFirst {
  async _handle(request: Request, handler: StrategyHandler): Promise<Response> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
      if (attempt > 0) {
        await new Promise((resolve) => {
          setTimeout(resolve, retryDelaysMs[attempt - 1]);
        });
      }

      try {
        return await super._handle(request, handler);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }
}

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
  handler: new RetryingNetworkFirst({
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
  handler: new RetryingNetworkFirst({
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
   * 控えも無く、取得にも失敗したときに出す画面。
   * ページの読み込みだけを差し替える。画像や JSON はそのまま失敗させる。
   *
   * 端末の navigator.onLine では判定しない。繋がっていると言いながら
   * 実際には届かないことがあり、そのときブラウザ本来のエラー画面になる。
   * 遅いだけの回線は上の NetworkFirst が待つので、ここまで来ない。
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
