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
    await expect(page.locator("h1")).toHaveText("ComicTime");
    expect(errors).toEqual([]);
  });

  test("サイドメニューは1回の押下で移る", async ({ page }) => {
    const errors: string[] = [];

    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/");

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

  test("作品のカードから外部へ出る口がある", async ({ page }) => {
    await page.goto("/");

    const card = page.locator('main a[target="_blank"]').first();

    await expect(card).toHaveAttribute("href", /^https?:\/\//);
    await expect(card).toHaveAttribute("rel", /noopener/);
  });
});
