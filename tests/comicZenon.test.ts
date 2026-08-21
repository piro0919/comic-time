import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import comicZenon from "../scripts/scrape/sources/comicZenon.ts";
import { serve } from "./serve.ts";

let served = serve({});

before(() => {
  served = serve({ "comic-zenon.com": "comicZenon.html" });
});

after(() => {
  served.restore();
});

test("配信日ごとの区画から、その日のぶんを返す", async () => {
  const works = await comicZenon("2026-08-20");
  const titles = works.map((work) => work.title);

  assert.equal(works.length, 5);
  assert.ok(titles.includes("僕だけ詠める禁書魔術"));
  assert.deepEqual((await comicZenon("2026-08-19")).length, 6);
});

/** 更新は12時。それより前に走ると今日の区画がまだ無い */
test("区画が無い日は空になる", async () => {
  const works = await comicZenon("2026-08-21");

  assert.deepEqual(works, []);
});

/** 区画には編集部のお知らせが混じる。作品ではないので外す */
test("お知らせは作品として出さない", async () => {
  const works = await comicZenon("2026-08-20");
  const titles = works.map((work) => work.title);

  assert.ok(!titles.some((title) => title.includes("更新スケジュール")));
});

test("住所は絶対URLで返る", async () => {
  const works = await comicZenon("2026-08-20");

  works.forEach((work) => {
    assert.match(work.url, /^https:\/\/comic-zenon\.com\//);
  });
});
