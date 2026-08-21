import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import youngAceUp from "../scripts/scrape/sources/youngAceUp.ts";
import { serve } from "./serve.ts";

let served = serve({});

before(() => {
  served = serve({ "/youngaceup/": "youngAceUp.html" });
});

after(() => {
  served.restore();
});

/**
 * 一覧の見出しは13文字で切られる。切られたままだと、同じ作品がカドコミにも
 * 載っていることが分からず、どのサイトのぶんかの印が出なくなる。
 */
test("題名は省略されない形で返る", async () => {
  const works = await youngAceUp("2026-08-20");
  const titles = works.map((work) => work.title);

  assert.ok(
    titles.includes(
      "あきらめ令嬢は恋心なんていらない。～裏切られたはずなのに、婚約者からの溺愛が止まりません！～",
    ),
  );
  assert.deepEqual(
    titles.filter((title) => title.endsWith("...")),
    [],
  );
});

test("その日の枠にある作品だけを返す", async () => {
  const works = await youngAceUp("2026-08-20");

  assert.equal(works.length, 4);
});

test("更新の枠が無い日は空になる", async () => {
  const works = await youngAceUp("2026-08-21");

  assert.deepEqual(works, []);
});

test("住所と絵は絶対URLで返る", async () => {
  const works = await youngAceUp("2026-08-20");

  works.forEach((work) => {
    assert.match(work.url, /^https:\/\//);
    assert.match(work.thumbnailUrl ?? "", /^https:\/\//);
  });
});
