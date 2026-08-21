import assert from "node:assert/strict";
import { test } from "node:test";
import workCards, { siteOf, titleKey, workKey } from "../src/app/workCards.ts";
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

test("複数サイトに載る作品には、どのサイトのぶんかの印が付く", () => {
  const title = "あきらめ令嬢は恋心なんていらない。";
  const both = [
    siteOf(work("カドコミ", kadokomi, title)),
    siteOf(work("ヤングエースUP公式サイト", youngAceUp, title)),
  ];
  const cards = workCards([work("カドコミ", kadokomi, title)], {
    [titleKey(title)]: both,
  });

  assert.equal(cards[0].badge?.siteUrl, kadokomi);
  assert.equal(cards[0].badge?.iconUrl, "/site-icons/comic-walker.png");
});

test("1つのサイトにしか載らない作品には印を付けない", () => {
  const title = "1サイトだけの作品";
  const cards = workCards([work("カドコミ", kadokomi, title)], {
    [titleKey(title)]: [siteOf(work("カドコミ", kadokomi, title))],
  });

  assert.equal(cards[0].badge, null);
});

/** 取得側が題名を切ってしまうと、同じ作品だと分からず印が消える */
test("題名が切られていると、複数サイトの作品として揃わない", () => {
  const full = "あきらめ令嬢は恋心なんていらない。～裏切られたはずなのに～";

  assert.notEqual(titleKey(full), titleKey("あきらめ令嬢は恋心なんてい..."));
});
