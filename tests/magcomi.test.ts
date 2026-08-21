import assert from "node:assert/strict";
import { after, test } from "node:test";
import magcomi from "../scripts/scrape/sources/magcomi.ts";

const realFetch = globalThis.fetch;

after(() => {
  globalThis.fetch = realFetch;
});

/**
 * フィードには作品でないものも流れ、作りの上では作品と区別が付かない。
 * 名前で外しているので、その並びが効いているかを見る。
 */
test("作品でないものは名前で外す", async () => {
  const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>第1話</title>
    <content>ふつうの作品</content>
    <link href="/episodes/1" />
    <updated>2026-08-21T03:00:00Z</updated>
  </entry>
  <entry>
    <title>応募受付中</title>
    <content>1ページ漫画賞「箱庭」</content>
    <link href="/episodes/2" />
    <updated>2026-08-21T03:00:00Z</updated>
  </entry>
</feed>`;

  globalThis.fetch = (async () =>
    new Response(feed, { status: 200 })) as typeof fetch;

  const works = await magcomi("2026-08-21");

  assert.deepEqual(
    works.map((work) => work.title),
    ["ふつうの作品"],
  );
});
