import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import kurageBunch from "../scripts/scrape/sources/kurageBunch.ts";
import { serve } from "./serve.ts";

let served = serve({});

before(() => {
  served = serve({ "kuragebunch.com": "kurageBunch.html" });
});

after(() => {
  served.restore();
});

/** 火曜と金曜の更新で、トップに直近2回ぶんの区画が並ぶ */
test("見出しの日付が合う区画から返す", async () => {
  const works = await kurageBunch("2026-08-18");
  const titles = works.map((work) => work.title);

  assert.equal(works.length, 8);
  assert.ok(titles.includes("事故物件で猫を飼う"));
});

test("前の回の区画も日付で選べる", async () => {
  const works = await kurageBunch("2026-08-14");
  const titles = works.map((work) => work.title);

  assert.equal(works.length, 8);
  assert.ok(titles.includes("釣り竿ひとつで異世界放浪"));
});

test("どちらの区画とも合わない日は空になる", async () => {
  const works = await kurageBunch("2026-08-21");

  assert.deepEqual(works, []);
});

/** 区画の末尾に姉妹サイトへの誘導が混じる */
test("外のサイトへのリンクは出さない", async () => {
  const works = await kurageBunch("2026-08-18");

  works.forEach((work) => {
    assert.match(work.url, /^https:\/\/kuragebunch\.com\//);
  });
});
