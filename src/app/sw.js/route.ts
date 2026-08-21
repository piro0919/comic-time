/**
 * 以前この場所には、画面を控えて圏外でも出す Service Worker があった。
 * 立ち上げた直後に取得が失敗すると、繋がっているのにオフライン画面が出る。
 * 圏外で昨日の一覧を見返せる見返りに合わないので、控えるのをやめた。
 *
 * すでに端末へ入ったものは、コードを消しただけでは動き続ける。
 * 同じ道すじで、自分を消して控えも捨てるものを配り、置き換わるのを待つ。
 */
const teardown = `self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.registration.unregister();

      const names = await caches.keys();

      await Promise.all(names.map((name) => caches.delete(name)));

      // 控えから出した画面を見ている人を、生きている画面へ戻す
      const clients = await self.clients.matchAll({ type: "window" });

      clients.forEach((client) => client.navigate(client.url));
    })(),
  );
});
`;

export const dynamic = "force-static";

export function GET(): Response {
  return new Response(teardown, {
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "text/javascript; charset=utf-8",
    },
  });
}
