import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import shuro from "../scripts/scrape/sources/shuro.ts";
import { serve } from "./serve.ts";

let served = serve({});

before(() => {
  served = serve({ "shuro.world": "shuro.html" });
});

after(() => {
  served.restore();
});

/** 作品ごとに配信日が書かれている。一覧そのものは日で分かれていない */
test("配信日が今日のものだけを返す", async () => {
  const works = await shuro("2026-08-21");

  assert.deepEqual(
    works.map((work) => work.title),
    ["甘くて辛くて酸っぱい", "ノラのいのち"],
  );
});

test("配信日が合わない日は空になる", async () => {
  const works = await shuro("2026-08-20");

  assert.deepEqual(works, []);
});

test("住所は絶対URLで返る", async () => {
  const works = await shuro("2026-08-21");

  works.forEach((work) => {
    assert.match(work.url, /^https:\/\/shuro\.world\//);
  });
});
