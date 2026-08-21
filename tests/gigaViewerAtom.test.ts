import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import gigaViewerAtom from "../scripts/scrape/sources/gigaViewerAtom.ts";
import { serve } from "./serve.ts";

const origin = "https://comic-action.com/";

let served = serve({});

before(() => {
  served = serve({ "/atom": "comicActionAtom.xml" });
});

after(() => {
  served.restore();
});

test("フィードの日と同じ日の作品を返す", async () => {
  const works = await gigaViewerAtom(origin, "2026-08-18");
  const titles = works.map((work) => work.title);

  assert.ok(titles.includes("ホストと社畜"));
  assert.ok(titles.includes("変な絵"));
  assert.equal(works.length, 15);
});

/** 話のタイトルではなく作品名を出す。作品名は content に入っている */
test("題名は話ではなく作品のもの", async () => {
  const works = await gigaViewerAtom(origin, "2026-08-18");

  works.forEach((work) => {
    assert.doesNotMatch(work.title, /第\d+話/);
  });
});

test("別の日には何も返らない", async () => {
  const works = await gigaViewerAtom(origin, "2026-08-19");

  assert.deepEqual(works, []);
});

/**
 * フィードの日時は UTC で書かれる。日本時間に直してから日を見ないと、
 * 日付をまたぐ時間帯の更新が前の日のものになってしまう。
 */
test("日は日本時間で見る", async () => {
  const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>第1話</title>
    <content>日をまたいだ作品</content>
    <link href="/episodes/1" />
    <updated>2026-08-17T15:30:00Z</updated>
  </entry>
</feed>`;
  const outer = globalThis.fetch;

  globalThis.fetch = (async () =>
    new Response(feed, { status: 200 })) as typeof fetch;

  try {
    // 2026-08-17T15:30:00Z は日本時間の 8月18日 0:30
    const works = await gigaViewerAtom(origin, "2026-08-18");

    assert.deepEqual(
      works.map((work) => work.title),
      ["日をまたいだ作品"],
    );
  } finally {
    globalThis.fetch = outer;
  }
});

test("住所は絶対URLで返る", async () => {
  const works = await gigaViewerAtom(origin, "2026-08-18");

  works.forEach((work) => {
    assert.match(work.url, /^https:\/\//);
  });
});
