import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import sundayWebry from "../scripts/scrape/sources/sundayWebry.ts";
import { serve } from "./serve.ts";

let served = serve({});

before(() => {
  served = serve({ "sunday-webry.com": "sundayWebry.html" });
});

after(() => {
  served.restore();
});

/** 「今日の更新」と「昨日の更新」が同じ節に並ぶ。先に来る今日ぶんだけを取る */
test("今日の一覧だけを返す", async () => {
  const works = await sundayWebry("2026-08-21");
  const titles = works.map((work) => work.title);

  assert.equal(works.length, 10);
  assert.ok(titles.includes("きょうもバレずに過ごせた！"));
});

test("見出しの日付が今日でなければ取りやめる", async () => {
  await assert.rejects(
    async () => sundayWebry("2026-08-22"),
    /見出しの日付が今日ではない/,
  );
});

test("住所は絶対URLで返る", async () => {
  const works = await sundayWebry("2026-08-21");

  works.forEach((work) => {
    assert.match(work.url, /^https:\/\/www\.sunday-webry\.com\//);
  });
});
