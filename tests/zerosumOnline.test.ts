import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import zerosumOnline from "../scripts/scrape/sources/zerosumOnline.ts";
import { serve } from "./serve.ts";

let served = serve({});

before(() => {
  served = serve({ "api.zerosumonline.com": "zerosumOnlineHome.bin" });
});

after(() => {
  served.restore();
});

/** 更新日ごとのグループが入るので、その日のぶんだけを取る */
test("その日のグループの作品を返す", async () => {
  const works = await zerosumOnline("2026-08-14");
  const titles = works.map((work) => work.title);

  assert.equal(works.length, 24);
  assert.ok(titles.includes("最強総長はいつわりの悪女を溺愛する"));
});

/** 更新は12時。それより前に走ると今日のグループがまだ無い */
test("グループが無い日は空になる", async () => {
  const works = await zerosumOnline("2026-08-21");

  assert.deepEqual(works, []);
});

test("住所は作品のスラッグから組み立てる", async () => {
  const works = await zerosumOnline("2026-08-14");

  works.forEach((work) => {
    assert.match(work.url, /^https:\/\/zerosumonline\.com\/detail\/[\w-]+$/);
  });
});

test("取れなかったときは例外にする", async () => {
  const outer = globalThis.fetch;

  globalThis.fetch = (async () =>
    new Response("", {
      status: 502,
      statusText: "Bad Gateway",
    })) as typeof fetch;

  try {
    await assert.rejects(async () => zerosumOnline("2026-08-14"), /502/);
  } finally {
    globalThis.fetch = outer;
  }
});
