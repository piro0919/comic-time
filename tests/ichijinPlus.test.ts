import assert from "node:assert/strict";
import { after, test } from "node:test";
import ichijinPlus from "../scripts/scrape/sources/ichijinPlus.ts";

const realFetch = globalThis.fetch;

after(() => {
  globalThis.fetch = realFetch;
});

const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>第10話</title>
    <content>裏切られた盗賊、怪盗魔王になって世界を掌握する</content>
    <link href="https://ichicomi.com/episode/12207421984188204398" />
    <updated>2026-11-13T02:00:00Z</updated>
  </entry>
  <entry>
    <title>第40話</title>
    <content>前の日に出た作品</content>
    <link href="https://ichicomi.com/episode/12207421984188204000" />
    <updated>2026-11-12T02:00:00Z</updated>
  </entry>
</feed>`;

/** フィードは話ごとに日時を持つ。今日ぶんだけを拾う */
test("その日に更新された作品だけを返す", async () => {
  globalThis.fetch = (async () =>
    new Response(feed, { status: 200 })) as typeof fetch;

  const works = await ichijinPlus("2026-11-13");

  assert.deepEqual(
    works.map((work) => work.title),
    ["裏切られた盗賊、怪盗魔王になって世界を掌握する"],
  );
});

/** 日本時間の11時更新なので、日付の境目で前の日に寄らないことを見る */
test("前の日のぶんは出さない", async () => {
  globalThis.fetch = (async () =>
    new Response(feed, { status: 200 })) as typeof fetch;

  const works = await ichijinPlus("2026-11-12");

  assert.deepEqual(
    works.map((work) => work.title),
    ["前の日に出た作品"],
  );
});
