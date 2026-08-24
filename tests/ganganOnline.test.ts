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

  assert.equal(works.length, 15);
  assert.ok(titles.includes("汝、現代ダンジョンに希望を持つべからず"));
});

/** 画面の札には作品への道しか無い。話の番号は __NEXT_DATA__ にしか入っていない */
test("最新話まで開く住所を返す", async () => {
  const works = await ganganOnline();

  assert.equal(
    works[0].url,
    "https://www.ganganonline.com/title/2304/chapter/129108",
  );
});

/**
 * 節が見つからないまま空を返すと更新が無かったことになるので、例外にする。
 * 埋め込みそのものが消えた場合も同じ。
 */
test("節が見つからなければ例外にする", async () => {
  const outer = globalThis.fetch;

  globalThis.fetch = (async () =>
    new Response(
      '<body><script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{"data":{"sections":[]}}}}</script></body>',
      { status: 200 },
    )) as typeof fetch;

  try {
    await assert.rejects(async () => ganganOnline(), /今日の更新作品/);
  } finally {
    globalThis.fetch = outer;
  }
});

test("埋め込みが無ければ例外にする", async () => {
  const outer = globalThis.fetch;

  globalThis.fetch = (async () =>
    new Response("<body><div>作り替えられた画面</div></body>", {
      status: 200,
    })) as typeof fetch;

  try {
    await assert.rejects(async () => ganganOnline(), /__NEXT_DATA__/);
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
