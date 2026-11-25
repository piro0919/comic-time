import assert from "node:assert/strict";
import { test } from "node:test";
import updateRhythm, { updatesByMonth } from "../src/lib/updateRhythm.ts";

test("更新が3回に満たなければ判定しない", () => {
  assert.equal(updateRhythm(["2026-11-04", "2026-11-11"], "2026-11-12"), null);
});

test("間隔の中央値で分ける", () => {
  const cases: [string[], string][] = [
    [["2026-11-01", "2026-11-03", "2026-11-06", "2026-11-08"], "週2回以上"],
    [["2026-11-04", "2026-11-11", "2026-11-18"], "週1"],
    [["2026-10-21", "2026-11-04", "2026-11-18"], "隔週"],
    [["2026-09-18", "2026-10-18", "2026-11-18"], "月1"],
    [["2026-10-01", "2026-10-21", "2026-11-10"], "不定期"],
  ];

  cases.forEach(([updates, rhythm]) => {
    assert.equal(updateRhythm(updates, "2026-11-19")?.rhythm, rhythm);
  });
});

test("いつもの間隔の2.5倍を過ぎたら休載中", () => {
  const weekly = ["2026-11-04", "2026-11-11", "2026-11-18"];

  // 7日 × 2.5 = 17.5日
  assert.equal(updateRhythm(weekly, "2026-12-05")?.paused, false);
  assert.equal(updateRhythm(weekly, "2026-12-06")?.paused, true);
});

test("月ごとに新しい順で束ねる", () => {
  assert.deepEqual(
    updatesByMonth(["2026-10-28", "2026-11-04", "2026-10-21", "2026-11-11"]),
    [
      { days: [11, 4], label: "11月" },
      { days: [28, 21], label: "10月" },
    ],
  );
});

test("年をまたぐ履歴だけ見出しに年を付ける", () => {
  assert.deepEqual(
    updatesByMonth(["2026-12-30", "2027-01-06"]).map((month) => month.label),
    ["2027年1月", "2026年12月"],
  );
});

test("2日続けての更新は、休載の線を引くとき1回と数える", () => {
  // 木金に更新する作品。間隔は 1・6・1 で中央値は1日だが、決まった休みの間は休載中にしない
  const thursdayFriday = [
    "2026-11-12",
    "2026-11-13",
    "2026-11-19",
    "2026-11-20",
  ];

  assert.equal(updateRhythm(thursdayFriday, "2026-11-26")?.paused, false);
  // 6日 × 2.5 = 15日
  assert.equal(updateRhythm(thursdayFriday, "2026-12-05")?.paused, false);
  assert.equal(updateRhythm(thursdayFriday, "2026-12-06")?.paused, true);
});

test("毎日更新の作品は1日の間隔のまま線を引く", () => {
  const daily = ["2026-11-18", "2026-11-19", "2026-11-20"];

  assert.equal(updateRhythm(daily, "2026-11-22")?.paused, false);
  assert.equal(updateRhythm(daily, "2026-11-23")?.paused, true);
});
