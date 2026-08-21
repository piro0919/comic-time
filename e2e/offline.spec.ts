import { expect, test } from "@playwright/test";

/**
 * 画面を控える Service Worker は置かない。
 * 立ち上げた直後に取得が失敗すると、繋がっているのにオフライン画面が出ていた。
 */
test.describe("Service Worker", () => {
  test("画面を握る Service Worker は登録しない", async ({ page }) => {
    await page.goto("/day/tue");
    await page.waitForTimeout(2000);

    const controller = await page.evaluate(
      () => navigator.serviceWorker.controller?.scriptURL ?? null,
    );

    expect(controller).toBeNull();
  });

  test("すでに入っているものは、自分を消す作りに置き換わる", async ({
    page,
  }) => {
    await page.goto("/day/tue");

    const script = await page.evaluate(
      async () => await (await fetch("/sw.js")).text(),
    );

    expect(script).toContain("registration.unregister()");
    expect(script).toContain("caches.delete");
  });
});
