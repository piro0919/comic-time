import { type Page } from "@playwright/test";
import http from "http";

/**
 * Service Worker が制御を握り、控えの用意が終わるまで待つ。
 * ここを待たずに進めると、まだ何も控えていない状態を見てしまう。
 */
export async function waitForServiceWorker(page: Page): Promise<void> {
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, {
    timeout: 40000,
  });
  await page.waitForFunction(
    async () => {
      const names = await caches.keys();
      const precache = names.find((name) => name.includes("precache"));

      if (precache === undefined) {
        return false;
      }

      const keys = await (await caches.open(precache)).keys();

      return keys.some((request) => request.url.includes("~offline"));
    },
    null,
    { timeout: 40000 },
  );
}

export type SlowProxy = {
  close: () => Promise<void>;
  url: string;
};

/**
 * 遅いだけで、最終的にはちゃんと返る回線を作る。
 * Playwright の差し替えは Service Worker の通信には効かないので、
 * 手前に1枚挟んで実際に遅らせる。
 */
export async function startSlowProxy({
  delayMs,
  delayPaths,
  target,
}: {
  delayMs: number;
  delayPaths: string[];
  target: string;
}): Promise<SlowProxy> {
  const server = http.createServer((request, response) => {
    void (async (): Promise<void> => {
      const url = new URL(request.url ?? "/", "http://localhost");

      if (delayPaths.includes(url.pathname)) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      const forwarded: Record<string, string> = { host: new URL(target).host };

      Object.entries(request.headers).forEach(([key, value]) => {
        if (typeof value === "string" && key !== "host") {
          forwarded[key] = value;
        }
      });

      const proxied = await fetch(target + (request.url ?? "/"), {
        headers: forwarded,
        redirect: "manual",
      }).catch(() => null);

      if (proxied === null) {
        response.writeHead(502);
        response.end("upstream error");

        return;
      }

      const headers: Record<string, string> = {};

      proxied.headers.forEach((value, key) => {
        if (
          !["content-encoding", "content-length", "transfer-encoding"].includes(
            key,
          )
        ) {
          headers[key] = value;
        }
      });

      response.writeHead(proxied.status, headers);
      response.end(Buffer.from(await proxied.arrayBuffer()));
    })();
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));

  const address = server.address();
  const port =
    typeof address === "object" && address !== null ? address.port : 0;

  return {
    close: async () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
      }),
    url: `http://localhost:${port}`,
  };
}
