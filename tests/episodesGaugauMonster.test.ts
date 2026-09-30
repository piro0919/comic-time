import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import gaugauMonster from "../src/app/episodes/gaugauMonster.ts";

const realFetch = globalThis.fetch;
const work = "https://gaugau.futabanet.jp/list/work/5dce85b27765612448020000";

afterEach(() => {
  globalThis.fetch = realFetch;
});

/** 話の一覧のページだけを差し替える。頼まれた住所は asked に残す */
function serve(html: string): { asked: string[] } {
  const asked: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    asked.push(url);

    return url === `${work}/episodes`
      ? new Response(html, { status: 200 })
      : new Response("", { status: 404 });
  }) as typeof fetch;

  return { asked };
}

function item(
  href: null | string,
  num: string,
  button: string,
  date = "",
): string {
  return `<div class="episode__grid"><a${href === null ? "" : ` href="${href}"`}>
    <div class="episode__num">${num}</div><div class="episode__title"></div>
    ${date === "" ? "" : `<span>${date} 更新</span>`}
    <div class="episode__button">${button}</div></a></div>`;
}

test("がうがうモンスター: 札の文字で無料と有料を分け、先読み・公開予定・公開終了は外す", async () => {
  const { asked } = serve(
    [
      item(
        "https://gaugau.futabanet.jp/list/app",
        "第70話(2)",
        "<span>アプリ</span>で先読み",
      ),
      item(null, "第70話(1)", "公開予定"),
      item(`${work}/episodes/187`, "第69話(3)", "無料で読む", "2026年09月25日"),
      item(`${work}/episodes/186`, "第69話(2)", "<span>アプリ</span>で読む"),
      item(null, "第1話", "公開終了"),
    ].join(""),
  );
  const episodes = await gaugauMonster(`${work}/episodes/187`);

  assert.equal(asked[0], `${work}/episodes`);
  assert.deepEqual(episodes, [
    {
      access: "free",
      date: "2026-09-25",
      title: "第69話(3)",
      url: `${work}/episodes/187`,
    },
    {
      access: "paid",
      date: null,
      title: "第69話(2)",
      url: `${work}/episodes/186`,
    },
  ]);
});

test("がうがうモンスター: 読める話が1つも無ければ例外にする", async () => {
  serve("<div></div>");

  await assert.rejects(
    async () => gaugauMonster(`${work}/episodes/1`),
    /話が1つも/,
  );
});
