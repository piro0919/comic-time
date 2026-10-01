import assert from "node:assert/strict";
import { test } from "node:test";
import {
  booleanOf,
  dateOf,
  followsOf,
  httpUrlOf,
  InvalidInput,
  maxSites,
  maxWorks,
  opensOf,
  stringOf,
  stringsOf,
} from "../src/app/actionInput.ts";

test("文字列は空と長すぎるものと文字列でないものを弾く", () => {
  assert.equal(stringOf("abc", 3), "abc");
  assert.throws(() => stringOf("", 3), InvalidInput);
  assert.throws(() => stringOf("abcd", 3), InvalidInput);
  assert.throws(() => stringOf(1, 3), InvalidInput);
  assert.throws(() => stringOf(undefined, 3), InvalidInput);
});

test("配列は件数の上限を超えたら弾き、重複はまとめる", () => {
  assert.deepEqual(stringsOf(["a", "b", "a"], 3, 1), ["a", "b"]);
  assert.throws(() => stringsOf(["a", "b", "c", "d"], 3, 1), InvalidInput);
  assert.throws(() => stringsOf("a", 3, 1), InvalidInput);
  assert.throws(() => stringsOf(["a", 1], 3, 1), InvalidInput);
});

test("真偽値と日付と住所の形を確かめる", () => {
  assert.equal(booleanOf(true), true);
  assert.throws(() => booleanOf("true"), InvalidInput);
  assert.equal(dateOf("2026-10-01"), "2026-10-01");
  assert.throws(() => dateOf("2026/10/01"), InvalidInput);
  assert.equal(httpUrlOf("https://example.com/1"), "https://example.com/1");
  assert.throws(() => httpUrlOf("javascript:alert(1)"), InvalidInput);
});

test("合流の登録は { sites, works } の形と件数を確かめる", () => {
  assert.deepEqual(followsOf({ sites: ["https://a/"], works: ["k"] }), {
    sites: ["https://a/"],
    works: ["k"],
  });
  assert.throws(() => followsOf(null), InvalidInput);
  assert.throws(() => followsOf({ sites: [] }), InvalidInput);
  assert.throws(
    () =>
      followsOf({
        sites: [],
        works: Array.from({ length: maxWorks + 1 }, (_, index) => `${index}`),
      }),
    InvalidInput,
  );
  assert.throws(
    () =>
      followsOf({
        sites: Array.from({ length: maxSites + 1 }, (_, index) => `${index}`),
        works: [],
      }),
    InvalidInput,
  );
});

test("合流の既読は形の崩れた項目だけを落とす", () => {
  assert.deepEqual(
    opensOf({
      "https://example.com/1": "2026-10-01",
      "https://example.com/2": 3,
      legacyKey: "2026-08-01",
    }),
    [["https://example.com/1", "2026-10-01"]],
  );
  assert.throws(() => opensOf(["https://example.com/1"]), InvalidInput);
});
