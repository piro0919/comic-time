import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import comicWalker from "../scripts/scrape/sources/comicWalker.ts";
import { serve } from "./serve.ts";

let served = serve({});

before(() => {
  served = serve({ "/api/daily/new": "comicWalkerDaily.json" });
});

after(() => {
  served.restore();
});

test("その日の一覧だけを返す", async () => {
  const works = await comicWalker("2026-08-21");

  assert.equal(works.length, 5);
  assert.equal(works[0].title.startsWith("悪役令嬢覇王伝"), true);
});

test("別の日を頼めばその日のぶんを返す", async () => {
  const works = await comicWalker("2026-08-20");

  assert.equal(works.length, 5);
});

/** 更新は11時。それより前に走ると今日の日付がまだ一覧に無い */
test("一覧に無い日は空になる", async () => {
  const works = await comicWalker("2026-08-19");

  assert.deepEqual(works, []);
});

test("住所は作品の符号から組み立てる", async () => {
  const works = await comicWalker("2026-08-21");

  works.forEach((work) => {
    assert.match(work.url, /^https:\/\/comic-walker\.com\/detail\/KC_/);
  });
});

/** 作品ページの各話一覧は古い順で先頭の数話しか出ない。最新話は符号から作る */
test("最新話まで開く住所を返す", async () => {
  const works = await comicWalker("2026-08-21");

  works.forEach((work) => {
    assert.match(work.url, /\/episodes\/KC_\w+_E$/);
  });
});

test("取れなかったときは例外にする", async () => {
  const outer = globalThis.fetch;

  globalThis.fetch = (async () =>
    new Response("", {
      status: 503,
      statusText: "Service Unavailable",
    })) as typeof fetch;

  try {
    await assert.rejects(async () => comicWalker("2026-08-21"), /503/);
  } finally {
    globalThis.fetch = outer;
  }
});
