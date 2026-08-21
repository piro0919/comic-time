import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import yanmaga from "../scripts/scrape/sources/yanmaga.ts";
import { serve } from "./serve.ts";

let served = serve({});

before(() => {
  served = serve({ "yanmaga.jp": "yanmaga.html" });
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

test("住所は絶対URLで返る", async () => {
  const works = await yanmaga();

  works.forEach((work) => {
    assert.match(work.url, /^https:\/\/yanmaga\.jp\//);
  });
});
