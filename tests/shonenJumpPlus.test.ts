import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import shonenJumpPlus from "../scripts/scrape/sources/shonenJumpPlus.ts";
import { serve } from "./serve.ts";

let served = serve({});

before(() => {
  served = serve({ "shonenjumpplus.com": "shonenJumpPlus.html" });
});

after(() => {
  served.restore();
});

test("今日の節から返す", async () => {
  const works = await shonenJumpPlus("2026-08-21");
  const titles = works.map((work) => work.title);

  assert.equal(works.length, 10);
  assert.ok(titles.includes("ブヨトピア"));
});

/** 日付は「8月21日」のように0を落とした形で出る */
test("前の日の節はその日のぶんだけを返す", async () => {
  const works = await shonenJumpPlus("2026-08-20");

  assert.ok(works.length > 0);
  assert.notDeepEqual(
    works.map((work) => work.title),
    (await shonenJumpPlus("2026-08-21")).map((work) => work.title),
  );
});

test("節が無い日は例外にする", async () => {
  await assert.rejects(async () => shonenJumpPlus("2026-08-01"), /8月1日/);
});
