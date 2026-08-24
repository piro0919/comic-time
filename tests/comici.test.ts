import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import comici from "../scripts/scrape/sources/comici.ts";
import { serve } from "./serve.ts";

const origin = "https://championcross.jp/";
/** 月曜=1 なので金曜は5 */
const friday = 5;

let served = serve({});

before(() => {
  served = serve({
    // 月曜のぶんは印の無い一覧を返して、曜日が住所に入ることだけを見る
    "/day/1/1": "championCross2.html",
    "/day/5/1": "championCross1.html",
    "/day/5/2": "championCross2.html",
    "/new": "comiciSeriesNew.html",
  });
});

after(() => {
  served.restore();
});

test("更新の印が付いた作品だけを返す", async () => {
  const works = await comici(origin, friday);

  assert.equal(works.length, 14);
  assert.ok(works.every((work) => work.title !== ""));
});

/** 一覧は更新順に並ぶので、印の付いた作品が尽きたページから先は見ない */
test("印が尽きたら次のページを見に行かない", async () => {
  served.asked.length = 0;

  await comici(origin, friday);

  assert.deepEqual(
    served.asked.filter((url) => url.includes("/day/")),
    [`${origin}category/manga/day/5/1`, `${origin}category/manga/day/5/2`],
  );
});

test("曜日ごとに違うページを見る", async () => {
  served.asked.length = 0;

  await comici(origin, 1);

  assert.deepEqual(served.asked, [`${origin}category/manga/day/1/1`]);
});

/** 一覧に話への道は無い。作品ページの新着順の先頭が最新話にあたる */
test("最新話まで開く住所を返す", async () => {
  const works = await comici(origin, friday);

  works.forEach((work) => {
    assert.equal(work.url, `${origin}episodes/5078fc12c5ae3`);
  });
});

/** 既定の並びは古い順なので、新着順の /new を見に行く */
test("作品ページは新着順で見に行く", async () => {
  served.asked.length = 0;

  await comici(origin, friday);

  served.asked
    .filter((url) => url.includes("/series/"))
    .forEach((url) => {
      assert.match(url, /\/series\/[^/]+\/new$/);
    });
});

test("住所と絵は絶対URLで返る", async () => {
  const works = await comici(origin, friday);

  works.forEach((work) => {
    assert.match(work.url, /^https:\/\//);
    assert.match(work.thumbnailUrl ?? "", /^https?:\/\//);
  });
});
