import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import magazinePocket from "../scripts/scrape/sources/magazinePocket.ts";
import { serve } from "./serve.ts";

let served = serve({});

before(() => {
  served = serve({ "pocket.shonenmagazine.com": "magazinePocket.html" });
});

after(() => {
  served.restore();
});

test("今日の枠にある作品を返す", async () => {
  const works = await magazinePocket("2026-08-21");
  const titles = works.map((work) => work.title);

  assert.equal(works.length, 54);
  assert.ok(titles.includes("極悪令嬢は仁義を貫く"));
});

/**
 * 枠の作りが変わったまま黙って空を返すと、その日は更新が無かったことになる。
 * 見出しの日付が今日と違えば、取りやめて例外にする。
 */
test("見出しの日付が今日でなければ取りやめる", async () => {
  await assert.rejects(
    async () => magazinePocket("2026-08-22"),
    /見出しの日付が今日ではない: 08\/21/,
  );
});

test("同じ作品が複数話あっても1件にまとめる", async () => {
  const works = await magazinePocket("2026-08-21");
  const titles = works.map((work) => work.title);

  assert.equal(new Set(titles).size, titles.length);
});

test("住所は絶対URLで返る", async () => {
  const works = await magazinePocket("2026-08-21");

  works.forEach((work) => {
    assert.match(work.url, /^https:\/\/pocket\.shonenmagazine\.com\//);
  });
});
