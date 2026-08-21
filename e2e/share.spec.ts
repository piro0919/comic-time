import { expect, test } from "@playwright/test";

/**
 * PC とスマホでお気に入りを渡す流れ。
 * 短縮は本番のドメインでしか働かないため、ここでは長いリンクを通す。
 */
test.describe("お気に入りの受け渡し", () => {
  test("登録して渡し、別の端末で取り込める", async ({ baseURL, browser }) => {
    const sender = await browser.newContext({
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const from = await sender.newPage();

    await from.goto(`${baseURL}/day/tue`);
    await from.waitForTimeout(800);

    const stars = from.locator(
      'main button[aria-label$="をお気に入りに入れる"]',
    );
    const count = Math.min(5, await stars.count());

    test.skip(count === 0, "その日の更新が無いので登録できない");

    for (let index = 0; index < count; index += 1) {
      await stars.nth(index).click();
    }

    await from.getByRole("button", { name: /別の端末とやり取り/ }).click();
    await from
      .getByRole("button", { name: /リンクをコピー/ })
      .last()
      .click();

    const link = await from.evaluate(async () =>
      navigator.clipboard.readText(),
    );

    expect(link).toContain("/import#");
    await sender.close();

    // 受け取る側
    const receiver = await browser.newContext();
    const to = await receiver.newPage();

    await to.goto(link);
    await expect(to.getByText(`${count}件を受け取りました`)).toBeVisible();

    await to.getByRole("button", { name: "今の登録に追加" }).click();
    await expect(to.getByText(`${count}件を追加しました`)).toBeVisible();
    await expect(to).toHaveURL(/\/favorites/);

    const stored = await to.evaluate(
      () =>
        (
          JSON.parse(localStorage.getItem("favorites-v3") ?? "{}") as {
            works?: string[];
          }
        ).works?.length ?? 0,
    );

    expect(stored).toBe(count);
    await receiver.close();
  });

  test("渡されたリンクを、共有のパネルの中で受け取れる", async ({
    baseURL,
    browser,
  }) => {
    const sender = await browser.newContext({
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const from = await sender.newPage();

    await from.goto(`${baseURL}/day/wed`);
    await from.waitForTimeout(800);

    const stars = from.locator(
      'main button[aria-label$="をお気に入りに入れる"]',
    );
    const count = Math.min(3, await stars.count());

    test.skip(count === 0, "その日の更新が無いので登録できない");

    for (let index = 0; index < count; index += 1) {
      await stars.nth(index).click();
    }

    await from.getByRole("button", { name: /別の端末とやり取り/ }).click();
    await from
      .getByRole("button", { name: /リンクをコピー/ })
      .last()
      .click();

    const link = await from.evaluate(async () =>
      navigator.clipboard.readText(),
    );

    await sender.close();

    // 受け取る側。カメラアプリも画面遷移も通さず、同じパネルの中で終える
    const receiver = await browser.newContext();
    const to = await receiver.newPage();

    await to.goto(`${baseURL}/day/tue`);
    await to.getByRole("button", { name: /別の端末とやり取り/ }).click();
    await to
      .getByRole("combobox", { name: "渡すか受け取るかを選ぶ" })
      .selectOption("receive");
    await to.getByRole("textbox", { name: "渡されたリンク" }).fill(link);
    await to.getByRole("button", { exact: true, name: "読み取る" }).click();
    await expect(to.getByText(`${count}件を受け取りました`)).toBeVisible();
    await to.getByRole("button", { name: "今の登録に追加" }).click();
    await expect(to.getByText(`${count}件を追加しました`)).toBeVisible();
    // パネルは閉じ、見ていた画面はそのまま
    await expect(
      to.getByRole("combobox", { name: "渡すか受け取るかを選ぶ" }),
    ).toBeHidden();
    await expect(to).toHaveURL(/\/day\/tue/);

    const stored = await to.evaluate(
      () =>
        (
          JSON.parse(localStorage.getItem("favorites-v3") ?? "{}") as {
            works?: string[];
          }
        ).works?.length ?? 0,
    );

    expect(stored).toBe(count);
    await receiver.close();
  });

  test("登録が無いうちは、受け取る側を開いて出す", async ({
    baseURL,
    page,
  }) => {
    await page.goto(`${baseURL}/`);
    await page.getByRole("button", { name: /別の端末とやり取り/ }).click();

    const mode = page.getByRole("combobox", { name: "渡すか受け取るかを選ぶ" });

    await expect(mode).toHaveValue("receive");
    await expect(
      page.getByRole("textbox", { name: "渡されたリンク" }),
    ).toBeVisible();

    // 渡す側へ回せば、渡せない理由が出る
    await mode.selectOption("send");
    await expect(page.getByText("渡せる登録がまだありません")).toBeVisible();
  });

  test("壊れたリンクは読み取れないと伝える", async ({ baseURL, page }) => {
    await page.goto(`${baseURL}/import#1こわれている`);

    await expect(page.getByText("読み取れませんでした")).toBeVisible();
  });
});
