import assert from "node:assert/strict";
import { test } from "node:test";
import {
  nextTabHref,
  tabHrefs,
  tabLabel,
  weekOrder,
} from "../src/app/tabRoutes.ts";

const hrefs = tabHrefs(weekOrder(5));

test("曜日は今日から遡って並ぶ", () => {
  assert.deepEqual(weekOrder(5), [
    "fri",
    "thu",
    "wed",
    "tue",
    "mon",
    "sun",
    "sat",
  ]);
  assert.deepEqual(weekOrder(0), [
    "sun",
    "sat",
    "fri",
    "thu",
    "wed",
    "tue",
    "mon",
  ]);
});

test("並びはお気に入りで始まり、サイト一覧で終わる", () => {
  assert.deepEqual(hrefs, [
    "/favorites",
    "/day/fri",
    "/day/thu",
    "/day/wed",
    "/day/tue",
    "/day/mon",
    "/day/sun",
    "/day/sat",
    "/sites",
  ]);
});

test("左へ払うと次、右へ払うと前のページになる", () => {
  assert.equal(nextTabHref(hrefs, "/day/thu", 1), "/day/wed");
  assert.equal(nextTabHref(hrefs, "/day/thu", -1), "/day/fri");
});

test("入口はお気に入りと同じ場所として扱う", () => {
  assert.equal(nextTabHref(hrefs, "/", 1), "/day/fri");
});

test("両端は繋がっていて、お気に入りとサイト一覧は隣り合う", () => {
  assert.equal(nextTabHref(hrefs, "/favorites", -1), "/sites");
  assert.equal(nextTabHref(hrefs, "/sites", 1), "/favorites");
});

test("並びに載っていないページでは動かさない", () => {
  assert.equal(nextTabHref(hrefs, "/sites/comic-walker", 1), undefined);
  assert.equal(nextTabHref(hrefs, "/search", -1), undefined);
});

test("行き先の名前はタブと同じ書き方で、曜日は今日から遡った日付になる", () => {
  // 2026-09-30 は水曜
  const today = new Date(2026, 8, 30);

  assert.equal(tabLabel("/favorites", today), "お気に入り");
  assert.equal(tabLabel("/sites", today), "サイト一覧");
  assert.equal(tabLabel("/day/wed", today), "9/30（水）");
  assert.equal(tabLabel("/day/thu", today), "9/24（木）");
  assert.equal(tabLabel("/ranking", today), undefined);
});
