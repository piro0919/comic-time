import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import comicFuz from "../scripts/scrape/sources/comicFuz.ts";
import { serve } from "./serve.ts";

let served = serve({});

before(() => {
  served = serve({ "api.comic-fuz.com": "comicFuzHome.bin" });
});

after(() => {
  served.restore();
});

/** 応答の先頭の節が、そのまま画面の「今日の更新作品」にあたる */
test("先頭の節の作品を返す", async () => {
  const works = await comicFuz();
  const titles = works.map((work) => work.title);

  assert.equal(works.length, 7);
  assert.ok(titles.includes("桜の園～昭和純喫茶物語～"));
});

test("住所は作品の番号から、絵は配信元を足して組み立てる", async () => {
  const works = await comicFuz();

  works.forEach((work) => {
    assert.match(work.url, /^https:\/\/comic-fuz\.com\/manga\/\d+$/);
    assert.match(work.thumbnailUrl ?? "", /^https:\/\/img\.comic-fuz\.com\//);
  });
});

test("節が1つも返らなければ例外にする", async () => {
  const outer = globalThis.fetch;

  globalThis.fetch = (async () =>
    new Response(new Uint8Array([]), { status: 200 })) as typeof fetch;

  try {
    await assert.rejects(async () => comicFuz(), /節が1つも返らなかった/);
  } finally {
    globalThis.fetch = outer;
  }
});

test("取れなかったときは例外にする", async () => {
  const outer = globalThis.fetch;

  globalThis.fetch = (async () =>
    new Response("", {
      status: 500,
      statusText: "Internal Server Error",
    })) as typeof fetch;

  try {
    await assert.rejects(async () => comicFuz(), /500/);
  } finally {
    globalThis.fetch = outer;
  }
});
