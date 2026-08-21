import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import tonariNoYoungJump from "../scripts/scrape/sources/tonariNoYoungJump.ts";
import { serve } from "./serve.ts";

let served = serve({});

before(() => {
  served = serve({ "tonarinoyj.jp": "tonariNoYoungJump.html" });
});

after(() => {
  served.restore();
});

/**
 * 更新日の見出しは区画の先頭の項目に入り、次の見出しが出るまで同じ日が続く。
 * 日をまたいで拾うと、前の日の作品まで今日のものになる。
 */
test("見出しから次の見出しまでを、その日のぶんとして返す", async () => {
  const thursday = await tonariNoYoungJump("2026-08-20");
  const wednesday = await tonariNoYoungJump("2026-08-19");

  assert.deepEqual(
    thursday.map((work) => work.title),
    [
      "ビーフジャーキーフランスパンサンド",
      "モンキーハンティング",
      "君のことが大大大大大好きな100人の彼女",
    ],
  );
  assert.equal(wednesday.length, 13);
});

/** 更新は12時。それより前に走ると今日の見出しがまだ無い */
test("見出しが無い日は空になる", async () => {
  const works = await tonariNoYoungJump("2026-08-21");

  assert.deepEqual(works, []);
});

/** 区画には他のサイトへの誘導が混じる */
test("外のサイトへのリンクは出さない", async () => {
  const works = await tonariNoYoungJump("2026-08-19");

  works.forEach((work) => {
    assert.match(work.url, /^https:\/\/tonarinoyj\.jp\//);
  });
});
