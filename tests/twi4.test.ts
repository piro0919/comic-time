import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import twi4, { isUpdated } from "../scripts/scrape/sources/twi4.ts";
import { serve } from "./serve.ts";

let served = serve({});

before(() => {
  served = serve({
    "/comics/twi4/": "twi4Top.html",
    "/comics/twi4/yojouhan/": "twi4Work.html",
  });
});

after(() => {
  served.restore();
});

/** ツイ４は更新日を出していないので、作品ごとの決まりと今の時刻から判じる */
const at = (
  hour: number,
  minute: number,
  weekday: string,
): { minutes: number; weekday: string } => ({
  minutes: hour * 60 + minute,
  weekday,
});

test("毎日の更新は、その時刻を過ぎていれば出す", () => {
  assert.equal(isUpdated("毎日17:00更新", at(17, 0, "金")), true);
  assert.equal(isUpdated("毎日17:00更新", at(16, 59, "金")), false);
});

test("1日に2回更新するものは、早い方の時刻で見る", () => {
  assert.equal(isUpdated("毎日8:00と16:00の2回更新", at(8, 0, "金")), true);
});

test("毎週の更新は、その曜日だけ出す", () => {
  assert.equal(isUpdated("毎週火曜7:30更新", at(12, 0, "火")), true);
  assert.equal(isUpdated("毎週火曜7:30更新", at(12, 0, "水")), false);
});

test("時刻より前の毎週の更新は出さない", () => {
  assert.equal(isUpdated("毎週火曜7:30更新", at(7, 29, "火")), false);
});

/** 読み取れない決まりで出してしまうと、更新していない作品が並ぶ */
test("決まりが読み取れないものは出さない", () => {
  assert.equal(isUpdated("不定期更新", at(23, 59, "金")), false);
  assert.equal(isUpdated("毎日更新", at(23, 59, "金")), false);
  assert.equal(isUpdated("", at(23, 59, "金")), false);
});

/** 完結した作品は一覧に残るが、更新はもう無い */
test("完結した作品は出さない", async () => {
  const works = await twi4();

  assert.deepEqual(
    works.map((work) => work.title),
    ["悪役令嬢の四畳半"],
  );
});

/** 一覧にも作品ページにも最新話の道は無い。バックナンバーの先頭が最新話 */
test("最新話まで開く住所を返す", async () => {
  const works = await twi4();

  assert.equal(
    works[0].url,
    "https://sai-zen-sen.jp/comics/twi4/yojouhan/0507.html",
  );
});
