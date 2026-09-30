import assert from "node:assert/strict";
import { test } from "node:test";
import workCards, { titleKey, workKey } from "../src/app/workCards.ts";
import { type Work } from "../src/types/work.ts";

function work(siteName: string, siteUrl: string, title: string): Work {
  return {
    foundAt: "12:00",
    siteName,
    siteUrl,
    thumbnailUrl: null,
    title,
    url: `${siteUrl}works/1`,
  };
}

const kadokomi = "https://comic-walker.com/";
const youngAceUp = "https://web-ace.jp/youngaceup/";

test("題名を揃えるとき、全角半角と波ダッシュと空白の違いは吸収する", () => {
  assert.equal(titleKey("ＡＢＣ　～序章～"), titleKey("abc〜序章〜"));
});

test("括弧の中身は落とさない。落とすと別作品を同じものにしてしまう", () => {
  assert.notEqual(titleKey("彼岸島"), titleKey("彼岸島（48日後）"));
});

test("見出しはサイトごとに分かれる", () => {
  assert.notEqual(
    workKey(kadokomi, "同じ題名"),
    workKey(youngAceUp, "同じ題名"),
  );
});

test("サイト名を書き直しても見出しは変わらない", () => {
  const before = workKey(kadokomi, "作品");

  assert.equal(workKey(kadokomi, "作品"), before);
});

test("どの作品にも、どのサイトのぶんかの印が付く", () => {
  const cards = workCards([work("カドコミ", kadokomi, "1サイトだけの作品")]);

  assert.equal(cards[0].badge.siteUrl, kadokomi);
  assert.equal(cards[0].badge.iconUrl, "/site-icons/comic-walker.png");
});

/** 取得側が題名を切ってしまうと、同じ作品だと分からなくなる */
test("題名が切られていると、複数サイトの作品として揃わない", () => {
  const full = "あきらめ令嬢は恋心なんていらない。～裏切られたはずなのに～";

  assert.notEqual(titleKey(full), titleKey("あきらめ令嬢は恋心なんてい..."));
});
