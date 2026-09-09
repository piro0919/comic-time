import assert from "node:assert/strict";
import { after, test } from "node:test";
import gaugauMonster from "../scripts/scrape/sources/gaugauMonster.ts";

const realFetch = globalThis.fetch;

after(() => {
  globalThis.fetch = realFetch;
});

/** 札は「9/9 更新」の形。間に空白が入る */
const page = `<html><body>
<div class="comicsSlider__gridItem">
  <a class="thumbnail" href="https://gaugau.futabanet.jp/list/work/aaa/episodes/29">
    <div class="img"><img src="https://gaugau.futabanet.jp/images/a.jpg" alt="">
      <div class="icon">9/9 更新</div>
    </div>
  </a>
  <a href="https://gaugau.futabanet.jp/list/work/aaa/episodes/29"><div class="comics__name">今日の作品</div></a>
</div>
<div class="comicsSlider__gridItem">
  <a href="/list/work/bbb/episodes/3"><div class="img"><img src="/b.jpg"><div class="icon">9/8 更新</div></div></a>
  <div class="comics__name">前の日の作品</div>
</div>
<div class="comicsSlider__gridItem">
  <a href="/list/work/ccc"><div class="img"><img src="/c.jpg"></div></a>
  <div class="comics__name">札の無い作品</div>
</div>
</body></html>`;

function serve(html: string): void {
  globalThis.fetch = (async () =>
    new Response(html, { status: 200 })) as typeof fetch;
}

test("その日の札が付いた作品だけを返す", async () => {
  serve(page);

  const works = await gaugauMonster("2026-09-09");

  assert.deepEqual(
    works.map((work) => work.title),
    ["今日の作品"],
  );
});

/** リンクは話そのものを指す。作品ページを見に行かなくてよい */
test("話の住所をそのまま返す", async () => {
  serve(page);

  const [work] = await gaugauMonster("2026-09-09");

  assert.equal(
    work?.url,
    "https://gaugau.futabanet.jp/list/work/aaa/episodes/29",
  );
});

test("更新の無い日は空になる", async () => {
  serve(page);

  assert.deepEqual(await gaugauMonster("2026-09-07"), []);
});
