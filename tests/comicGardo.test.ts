import assert from "node:assert/strict";
import { after, test } from "node:test";
import comicGardo from "../scripts/scrape/sources/comicGardo.ts";

const realFetch = globalThis.fetch;

after(() => {
  globalThis.fetch = realFetch;
});

const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>第42話「変革の兆し」(2)</title>
    <content>創成魔法の再現者</content>
    <link href="https://comic-gardo.com/episode/12207421984188204398" />
    <updated>2026-09-09T03:00:00Z</updated>
  </entry>
  <entry>
    <title>第40話</title>
    <content>前の日に出た作品</content>
    <link href="https://comic-gardo.com/episode/12207421984188204000" />
    <updated>2026-09-08T03:00:00Z</updated>
  </entry>
</feed>`;

/** フィードは話ごとに日時を持つ。今日ぶんだけを拾う */
test("その日に更新された作品だけを返す", async () => {
  globalThis.fetch = (async () =>
    new Response(feed, { status: 200 })) as typeof fetch;

  const works = await comicGardo("2026-09-09");

  assert.deepEqual(
    works.map((work) => work.title),
    ["創成魔法の再現者"],
  );
});

/** 日本時間の12時更新なので、日付の境目で前の日に寄らないことを見る */
test("前の日のぶんは出さない", async () => {
  globalThis.fetch = (async () =>
    new Response(feed, { status: 200 })) as typeof fetch;

  const works = await comicGardo("2026-09-08");

  assert.deepEqual(
    works.map((work) => work.title),
    ["前の日に出た作品"],
  );
});
