import assert from "node:assert/strict";
import { test } from "node:test";
import { nextTabHref, tabHrefs } from "../src/app/tabRoutes.ts";

const hrefs = tabHrefs(["fri", "thu", "wed", "tue", "mon", "sun", "sat"]);

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

test("両端から先へは出ない", () => {
  assert.equal(nextTabHref(hrefs, "/favorites", -1), undefined);
  assert.equal(nextTabHref(hrefs, "/sites", 1), undefined);
});

test("並びに載っていないページでは動かさない", () => {
  assert.equal(nextTabHref(hrefs, "/sites/comic-walker", 1), undefined);
  assert.equal(nextTabHref(hrefs, "/search", -1), undefined);
});
