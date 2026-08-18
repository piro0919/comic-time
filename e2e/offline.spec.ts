import { expect, test } from "@playwright/test";
import { startSlowProxy, waitForServiceWorker } from "./support.ts";

/**
 * 圏外の受け皿。過去に、遅いだけの回線を圏外として扱って
 * 本番でオフライン画面を出した経緯がある。
 */
test.describe("圏外での見え方", () => {
  test("一度開いたページは圏外でも控えから出る", async ({ context, page }) => {
    await page.goto("/day/tue");
    await waitForServiceWorker(page);
    await page.goto("/day/tue");
    await page.waitForTimeout(1000);

    await context.setOffline(true);
    await page.goto("/day/tue").catch(() => undefined);

    await expect(page).toHaveTitle(/火曜日の更新/, { timeout: 15000 });
  });

  test("開いていないページは圏外だとオフライン画面になる", async ({
    context,
    page,
  }) => {
    await page.goto("/day/tue");
    await waitForServiceWorker(page);
    // 実際に1回ぶん処理させてから切る。制御を握った直後は取りこぼす
    await page.goto("/day/tue");
    await page.waitForTimeout(1000);

    await context.setOffline(true);
    await page.goto("/day/sat").catch(() => undefined);

    await expect(page).toHaveTitle(/オフライン/, { timeout: 15000 });
  });

  test("遅いだけの回線ではオフライン画面を出さない", async ({
    browser,
    baseURL,
  }) => {
    const proxy = await startSlowProxy({
      delayMs: 9000,
      delayPaths: ["/day/sat"],
      target: baseURL ?? "",
    });

    try {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(`${proxy.url}/day/tue`);
      await waitForServiceWorker(page);

      // 9秒かかるが、最終的にはちゃんと返る
      await page.goto(`${proxy.url}/day/sat`, { timeout: 40000 });

      await expect(page).toHaveTitle(/土曜日の更新/);
      await context.close();
    } finally {
      await proxy.close();
    }
  });

  test("画面の控えと画面内移動の控えは枠を分けてある", async ({ page }) => {
    await page.goto("/day/tue");
    await waitForServiceWorker(page);

    for (const path of ["/day/tue", "/day/wed", "/day/thu", "/favorites"]) {
      await page.goto(path);
      await page.waitForTimeout(600);
    }

    const documents = await page.evaluate(async () => {
      const names = await caches.keys();

      if (!names.includes("pages")) {
        return [];
      }

      const keys = await (await caches.open("pages")).keys();

      return keys
        .map((request) => new URL(request.url).pathname)
        .filter((pathname, index, all) => all.indexOf(pathname) === index);
    });

    // 同じ枠に混ぜていた頃は、数ページ見ただけで押し出されていた
    expect(documents).toEqual(
      expect.arrayContaining([
        "/day/tue",
        "/day/wed",
        "/day/thu",
        "/favorites",
      ]),
    );
  });
});
