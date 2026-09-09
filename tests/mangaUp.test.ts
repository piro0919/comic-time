import assert from "node:assert/strict";
import { after, test } from "node:test";
import mangaUp from "../scripts/scrape/sources/mangaUp.ts";

const realFetch = globalThis.fetch;

after(() => {
  globalThis.fetch = realFetch;
});

/** 見出しの隣に「もっと見る」があり、同じ区画に別の住所が混じる */
const page = `<html><body>
<section>
  <h2>おすすめ</h2>
  <a href="https://www.manga-up.com/titles/999"><img alt="別の区画の作品" src="/x.webp"></a>
</section>
<section>
  <div><h2>今日の更新（水曜日）</h2><a href="/series"><button>もっと見る</button></a></div>
  <div>
    <a href="https://www.manga-up.com/titles/1637"><img alt="今日の作品" src="https://ja-img.manga-up.com/1637.webp"></a>
    <a href="https://www.manga-up.com/titles/1153"><img alt="もう1つの今日の作品" src="/1153.webp"></a>
  </div>
</section>
</body></html>`;

function serve(html: string): void {
  globalThis.fetch = (async () =>
    new Response(html, { status: 200 })) as typeof fetch;
}

test("今日の更新の区画にある作品だけを返す", async () => {
  serve(page);

  const works = await mangaUp();

  assert.deepEqual(
    works.map((work) => work.title),
    ["今日の作品", "もう1つの今日の作品"],
  );
});

test("作品ページの住所を返す。話への道は無い", async () => {
  serve(page);

  const works = await mangaUp();

  assert.equal(works[0]?.url, "https://www.manga-up.com/titles/1637");
  assert.equal(works[1]?.thumbnailUrl, "https://www.manga-up.com/1153.webp");
});

/** 区画ごと消えたら、その日を空にするのではなく壊れたと分かるようにする */
test("区画が見つからなければ例外にする", async () => {
  serve("<html><body><h2>おしらせ</h2></body></html>");

  await assert.rejects(async () => mangaUp());
});
