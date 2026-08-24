import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import comicMeteor from "../scripts/scrape/sources/comicMeteor.ts";
import { serve } from "./serve.ts";

let served = serve({});

before(() => {
  served = serve({
    "kirapo.jp/meteor": "comicMeteor.html",
    "kirapo.jp/meteor/titles/": "comicMeteorTitle.html",
    "kirapo.jp/meteor/titles/prebl": "comicMeteorOneshot.html",
  });
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

/** 一覧に話への道は無い。作品ページの「最新話を読む」を辿る */
test("最新話まで開く住所を返す", async () => {
  const works = await comicMeteor("2026-08-19");
  const latest = works.find(
    (work) =>
      work.title === "一番街でつかまえて～14歳から始めるぼったくりキャッチ～",
  );

  assert.equal(
    latest?.url,
    "https://kirapo.jp/pt/meteor/aroundforty/2022793/viewer",
  );
});

/** 読み切りには「最新話を読む」が無く、読む道が1つだけ置かれる */
test("読み切りはその1つを返す", async () => {
  const works = await comicMeteor("2026-08-19");
  const oneshot = works.find((work) => work.title === "魔法少女は黒に染まる");

  assert.equal(
    oneshot?.url,
    "https://kirapo.jp/pt/meteor/prebl/2022886/viewer",
  );
});

test("住所は絶対URLで返る", async () => {
  const works = await comicMeteor("2026-08-19");

  works.forEach((work) => {
    assert.match(work.url, /^https:\/\/kirapo\.jp\//);
  });
});
