import { expect, test } from "@playwright/test";

/**
 * 画面を触ったときに壊れていないかを見る。
 * 過去に、配色の切り替えが画面遷移を巻き込んで壊した経緯がある。
 */
test.describe("画面の操作", () => {
  test("読み込んで例外が出ない", async ({ page }) => {
    const errors: string[] = [];

    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/");
    // 何も登録していないと今日の曜日へ送られる。見出しは画面ごとに1つ
    await expect(page.getByRole("link", { name: "ComicTime" })).toBeVisible();
    await expect(page.locator("h1")).toHaveText(/の更新$/);
    expect(errors).toEqual([]);
  });

  test("サイドメニューは1回の押下で移る", async ({ page }) => {
    const errors: string[] = [];

    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/");
    // トップは今日の一覧かお気に入りへ移る。落ち着く前に押すと取りこぼす
    await page.waitForURL(/\/(day\/|favorites)/);

    const link = page.locator('aside a[href^="/day/"]').nth(2);
    const href = await link.getAttribute("href");

    await link.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    expect(errors).toEqual([]);
  });

  test("配色を切り替えたあとも移れる", async ({ page }) => {
    const errors: string[] = [];

    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/");
    await page.waitForURL(/\/(day\/|favorites)/);

    const toggle = page.getByRole("button", { name: /配色にする/ });

    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    // 上端の色も配色に付いてくる。React が描いた要素を消していないことの裏返し
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      "content",
      "#202124",
    );

    const link = page.locator('aside a[href^="/day/"]').nth(4);
    const href = await link.getAttribute("href");

    await link.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    expect(errors).toEqual([]);
  });

  test("作品のカードは別ページへ安全に開く", async ({ page }) => {
    // その日の更新が0件のこともあるので、当日のページを直接見る
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo",
      weekday: "short",
    })
      .format(new Date())
      .toLowerCase();

    await page.goto(`/day/${weekday}`);

    const cards = page.locator('main a[target="_blank"]');
    const count = await cards.count();

    if (count === 0) {
      // 取得がまだ回っていない日もある。画面が出ていることだけ確かめる
      await expect(page.locator("h1")).toHaveText("ComicTime");

      return;
    }

    await expect(cards.first()).toHaveAttribute("href", /^https?:\/\//);
    await expect(cards.first()).toHaveAttribute("rel", /noopener/);
  });
});

/**
 * 日付と曜日の対応。Vercel は UTC で動くため、日本時間で読まないと1日ずれる。
 * サイドバーの日付は端末側で作るので当てにならない。本体の見出しを見る。
 * 確かめる側はアプリと違う出し方（暦日から直接）で曜日を求める。
 */
test.describe("日付の見出し", () => {
  test("曜日が日付と合っている", async ({ page }) => {
    // その日の更新が0件のこともあるので、作品のある日を探す
    const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

    let starred = 0;

    for (const weekday of weekdays) {
      await page.goto(`/day/${weekday}`);

      const stars = page.locator(
        'main button[aria-label$="をお気に入りに入れる"]',
      );
      const count = Math.min(2, await stars.count());

      if (count === 0) {
        continue;
      }

      for (let index = 0; index < count; index += 1) {
        await stars.nth(index).click();
      }

      starred = count;

      break;
    }

    expect(starred, "7日ぶんのどこかに作品があるはず").toBeGreaterThan(0);

    await page.goto("/favorites");

    const labels = await page
      .locator("main")
      .locator("text=/^[0-9]+\\/[0-9]+（[日月火水木金土]）$/")
      .allInnerTexts();

    expect(labels.length).toBeGreaterThan(0);

    const japanese = ["日", "月", "火", "水", "木", "金", "土"];
    const year = Number(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
      }).format(new Date()),
    );

    labels.forEach((label) => {
      const matched = /^(\d+)\/(\d+)（(.)）$/.exec(label);
      const month = Number(matched?.[1]);
      const day = Number(matched?.[2]);
      const expected =
        japanese[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];

      expect(label).toBe(`${month}/${day}（${expected}）`);
    });
  });
});
