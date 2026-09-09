import assert from "node:assert/strict";
import { after, test } from "node:test";
import comicBoost from "../scripts/scrape/sources/comicBoost.ts";

const realFetch = globalThis.fetch;

after(() => {
  globalThis.fetch = realFetch;
});

/** 札は「9/8更新」の形。年は書かれていない */
const page = `<html><body>
<a class="top-comic-list-item" href="/content/01730001">
  <img class="thum" data-src="https://cdn.comic-boost.com/a.jpg" alt="">
  <ul class="badge-list new"><li class="badge new">NEW</li><li class="badge start-date">9/8更新</li></ul>
  <p class="title-name">火曜に出た作品</p>
</a>
<a class="top-comic-list-item" href="/content/01740001">
  <img class="thum" data-src="https://cdn.comic-boost.com/b.jpg" alt="">
  <ul class="badge-list"><li class="badge start-date">9/4更新</li></ul>
  <p class="title-name">前の週に出た作品</p>
</a>
<a class="top-comic-list-item" href="/content/01750001">
  <p class="title-name">札の無い作品</p>
</a>
</body></html>`;

function serve(html: string): void {
  globalThis.fetch = (async () =>
    new Response(html, { status: 200 })) as typeof fetch;
}

test("その日の札が付いた作品だけを返す", async () => {
  serve(page);

  const works = await comicBoost("2026-09-08");

  assert.deepEqual(
    works.map((work) => work.title),
    ["火曜に出た作品"],
  );
});

/** 火曜と金曜の更新なので、出ない日がある。空はサイトの休みであって失敗ではない */
test("更新の無い日は空になる", async () => {
  serve(page);

  assert.deepEqual(await comicBoost("2026-09-09"), []);
});

test("作品ページの住所と絵を返す", async () => {
  serve(page);

  const [work] = await comicBoost("2026-09-08");

  assert.equal(work?.url, "https://comic-boost.com/content/01730001");
  assert.equal(work?.thumbnailUrl, "https://cdn.comic-boost.com/a.jpg");
});
