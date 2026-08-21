import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import ganganOnline from "../scripts/scrape/sources/ganganOnline.ts";
import { serve } from "./serve.ts";

let served = serve({});

before(() => {
  served = serve({ "ganganonline.com": "ganganOnline.html" });
});

after(() => {
  served.restore();
});

/** トップには他の節も並ぶ。「今日の更新作品」の節だけを取る */
test("今日の更新作品の節から返す", async () => {
  const works = await ganganOnline();
  const titles = works.map((work) => work.title);

  assert.equal(works.length, 11);
  assert.ok(titles.includes("汝、現代ダンジョンに希望を持つべからず"));
});

/**
 * クラス名にはビルドごとのハッシュが付く。前方一致をやめると節を見失う。
 * 見失ったまま空を返すと更新が無かったことになるので、例外にする。
 */
test("節が見つからなければ例外にする", async () => {
  const outer = globalThis.fetch;

  globalThis.fetch = (async () =>
    new Response("<body><div>作り替えられた画面</div></body>", {
      status: 200,
    })) as typeof fetch;

  try {
    await assert.rejects(async () => ganganOnline(), /今日の更新作品/);
  } finally {
    globalThis.fetch = outer;
  }
});

test("住所と絵は絶対URLで返る", async () => {
  const works = await ganganOnline();

  works.forEach((work) => {
    assert.match(work.url, /^https:\/\/www\.ganganonline\.com\//);
    assert.match(work.thumbnailUrl ?? "", /^https:\/\//);
  });
});
