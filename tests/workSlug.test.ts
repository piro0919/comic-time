import assert from "node:assert/strict";
import { test } from "node:test";
import workSlug from "../src/app/workSlug.ts";

test("日本語はそのまま住所に使う", () => {
  assert.equal(workSlug("彼岸島"), "彼岸島");
});

test("住所として意味が変わる字は落とす", () => {
  assert.equal(workSlug("A/B?C#D<E>"), "abcde");
});

test("表記が揺れても同じ住所になる", () => {
  assert.equal(workSlug("ＡＢＣ　～序章～"), workSlug("abc〜序章〜"));
});

test("落とすものしか無い題名でも空にはしない", () => {
  assert.equal(workSlug("///"), "work");
});

test("書き出したファイル名が溢れないよう、住所の長さは切る", () => {
  const slug = workSlug("あ".repeat(200));

  assert.equal([...slug].length, 50);
  assert.ok(Buffer.byteLength(slug, "utf8") + ".prefetch.rsc".length < 255);
});
