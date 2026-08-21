import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import comicDays from "../scripts/scrape/sources/comicDays.ts";
import { serve } from "./serve.ts";

let served = serve({});

before(() => {
  served = serve({ "comic-days.com": "comicDays.html" });
});

after(() => {
  served.restore();
});

/**
 * 曜日ごとの区画に分かれ、見出しのタブが「木 8/20」のように曜日と日付を持つ。
 * タブを見ずに曜日だけで選ぶと、1週間前のぶんを今日として出してしまう。
 */
test("タブの日付から、その日の区画を選ぶ", async () => {
  const thursday = await comicDays("2026-08-20");
  const wednesday = await comicDays("2026-08-19");

  assert.equal(thursday.length, 32);
  assert.ok(thursday.map((work) => work.title).includes("つきかけ姉妹"));
  assert.equal(wednesday.length, 20);
});

/** 金曜のタブは1週間前の 8/14 を指す。今日の 8/21 とは合わない */
test("タブの日付と合わない日は空になる", async () => {
  const works = await comicDays("2026-08-21");

  assert.deepEqual(works, []);
});

test("外のサイトへのリンクは出さない", async () => {
  const works = await comicDays("2026-08-20");

  works.forEach((work) => {
    assert.match(work.url, /^https:\/\/comic-days\.com\//);
  });
});
