import assert from "node:assert/strict";
import { test } from "node:test";
import {
  type EventRow,
  type RankedWork,
  ranked,
  titleColumn,
  totalsByTitle,
} from "../src/app/workRanking.ts";
import { titleKey } from "../src/app/workCards.ts";

function row(title: null | string, count: number): EventRow {
  return { [titleColumn]: title, count, visitors: count };
}

function work(title: string, count: number): RankedWork {
  return {
    count,
    date: "2026-08-29",
    rank: 0,
    work: {
      foundAt: "12:00",
      siteName: "サイト",
      siteUrl: "https://example.com/",
      thumbnailUrl: null,
      title,
      url: "https://example.com/works/1",
    },
  };
}

test("同じ題名が二行に分かれて来ても足し合わせる", () => {
  const totals = totalsByTitle([row("アルテ", 3), row("アルテ", 4)]);

  assert.equal(totals.size, 1);
  assert.equal(totals.get(titleKey("アルテ")), 7);
});

test("表記が揺れていても同じ作品として数える", () => {
  const totals = totalsByTitle([
    row("ＡＢＣ　～序章～", 2),
    row("abc〜序章〜", 5),
  ]);

  assert.equal(totals.size, 1);
  assert.equal(totals.get(titleKey("abc〜序章〜")), 7);
});

/*
 * 集計の鍵は by に渡した文字列がそのまま返る。素の eventData だと思って
 * 読むと、本番だけ常に0件になる。一度それで空のまま出してしまった。
 */
test("題名の入る鍵は by に渡した名前と同じ", () => {
  assert.equal(titleColumn, "eventData/title");
});

test("題名の無いイベントは数えない", () => {
  assert.equal(totalsByTitle([row(null, 9), row("", 4)]).size, 0);
});

test("鍵が見つからない行が来ても落ちない", () => {
  const broken = [{ count: 5, visitors: 5 }] as unknown as EventRow[];

  assert.equal(totalsByTitle(broken).size, 0);
});

test("同じ回数なら同じ順位で、次はその件数ぶん飛ばす", () => {
  const rows = ranked([
    work("あ", 10),
    work("い", 3),
    work("う", 3),
    work("え", 1),
  ]);

  assert.deepEqual(
    rows.map((entry) => entry.rank),
    [1, 2, 2, 4],
  );
});

test("先頭が同数でも1位から始まる", () => {
  const rows = ranked([work("あ", 5), work("い", 5)]);

  assert.deepEqual(
    rows.map((entry) => entry.rank),
    [1, 1],
  );
});

test("空の一覧は空のまま返す", () => {
  assert.deepEqual(ranked([]), []);
});
