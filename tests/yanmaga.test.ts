import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import yanmaga from "../scripts/scrape/sources/yanmaga.ts";
import { serve } from "./serve.ts";

let served = serve({});

before(() => {
  served = serve({
    "yanmaga.jp": "yanmaga.html",
    "yanmaga.jp/comics/": "yanmagaComic.html",
  });
});

after(() => {
  served.restore();
});

/** 今日の更新は「マンガ」と「記事」に分かれる。記事はニュースなので出さない */
test("マンガの区画だけを返す", async () => {
  const works = await yanmaga();
  const titles = works.map((work) => work.title);

  assert.equal(works.length, 8);
  assert.ok(titles.includes("パラレルパラダイス"));
});

test("区画が見つからなければ例外にする", async () => {
  const outer = globalThis.fetch;

  globalThis.fetch = (async () =>
    new Response("<body><div>作り替えられた画面</div></body>", {
      status: 200,
    })) as typeof fetch;

  try {
    await assert.rejects(async () => yanmaga(), /マンガ/);
  } finally {
    globalThis.fetch = outer;
  }
});

/** 一覧に話への道は無い。作品ページの「最新話を読む」を辿る */
test("最新話まで開く住所を返す", async () => {
  const works = await yanmaga();

  works.forEach((work) => {
    assert.equal(
      decodeURI(work.url),
      "https://yanmaga.jp/comics/雪と墨/0732aa91d04f0fb540f9fe7de183991c",
    );
  });
});

test("住所は絶対URLで返る", async () => {
  const works = await yanmaga();

  works.forEach((work) => {
    assert.match(work.url, /^https:\/\/yanmaga\.jp\//);
  });
});
