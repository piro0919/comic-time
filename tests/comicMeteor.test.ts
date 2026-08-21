import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import comicMeteor from "../scripts/scrape/sources/comicMeteor.ts";
import { serve } from "./serve.ts";

let served = serve({});

before(() => {
  served = serve({ "kirapo.jp": "comicMeteor.html" });
});

after(() => {
  served.restore();
});

/** 掲載日の見出しと作品の並びが交互に置かれる。見出しの次の並びだけを取る */
test("掲載日の見出しに続く並びを返す", async () => {
  const works = await comicMeteor("2026-08-19");
  const titles = works.map((work) => work.title);

  assert.equal(works.length, 5);
  assert.ok(titles.includes("魔法少女は黒に染まる"));
});

test("見出しが無い日は空になる", async () => {
  const works = await comicMeteor("2026-08-21");

  assert.deepEqual(works, []);
});

/** 月と日が別々の要素に入るので、片方だけ合っても取らない */
test("月だけが合う日は取らない", async () => {
  const works = await comicMeteor("2026-08-01");

  assert.deepEqual(works, []);
});

test("住所は絶対URLで返る", async () => {
  const works = await comicMeteor("2026-08-19");

  works.forEach((work) => {
    assert.match(work.url, /^https:\/\/kirapo\.jp\//);
  });
});
