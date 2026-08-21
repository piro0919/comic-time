import assert from "node:assert/strict";
import { test } from "node:test";
import { isUpdated } from "../scripts/scrape/sources/twi4.ts";

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
