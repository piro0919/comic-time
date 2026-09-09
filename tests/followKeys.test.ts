import assert from "node:assert/strict";
import { test } from "node:test";
import { keyOf, refOf } from "../src/app/followKeys.ts";
import { workKey } from "../src/app/workCards.ts";

/** 複数サイトに載っている作品。サイトごとに別の見出しになる */
const title = "1日外出録ハンチョウ";
const yanmaga = "https://yanmaga.jp/";
const pocket = "https://pocket.shonenmagazine.com/";

test("見出しから、台帳の slug とサイトの組に移せる", () => {
  const ref = refOf(workKey(yanmaga, title));

  assert.equal(ref?.siteUrl, yanmaga);
  assert.equal(ref?.slug, "1日外出録ハンチョウ");
});

test("組から見出しに戻せる", () => {
  const key = workKey(yanmaga, title);

  assert.equal(keyOf(refOf(key) ?? { siteUrl: "", slug: "" }), key);
});

/** 同じ作品でも、読むサイトが違えば別の登録 */
test("サイトが違えば別の組になる", () => {
  const one = refOf(workKey(yanmaga, title));
  const other = refOf(workKey(pocket, title));

  assert.equal(one?.slug, other?.slug);
  assert.notEqual(one?.siteUrl, other?.siteUrl);
});

test("台帳に無い見出しは変換できない", () => {
  assert.equal(
    refOf(workKey("https://example.com/", "実在しない作品")),
    undefined,
  );
});
