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
/**
 * 作品ページの話の一覧。古い順に並び、上に「次の話を読む」がある。
 * 「もっと見る」で畳まれるので、先頭と末尾の数話だけが載る。
 */
const titlePage = `<html><body>
<a href="https://www.manga-up.com/titles/1637/chapters/12"><button>次の話を読む</button></a>
<a class="w-full" href="https://www.manga-up.com/titles/1637/chapters/11">第1話</a>
<a class="w-full" href="https://www.manga-up.com/titles/1637/chapters/12">第2話</a>
<a class="w-full" href="https://www.manga-up.com/titles/1637/chapters/30">第20話</a>
<a href="https://www.manga-up.com/titles/2000/chapters/99">おすすめの別作品</a>
</body></html>`;

function serve(html: string, work = ""): void {
  globalThis.fetch = (async (input: RequestInfo | URL) =>
    new Response(String(input).includes("/titles/1637") ? work : html, {
      status: 200,
    })) as typeof fetch;
}

test("今日の更新の区画にある作品だけを返す", async () => {
  serve(page);

  const works = await mangaUp({ pause: 0 });

  assert.deepEqual(
    works.map((work) => work.title),
    ["今日の作品", "もう1つの今日の作品"],
  );
});

test("作品ページの話の一覧の末尾を最新話として返す", async () => {
  serve(page, titlePage);

  const works = await mangaUp({ pause: 0 });

  assert.equal(
    works[0]?.url,
    "https://www.manga-up.com/titles/1637/chapters/30",
  );
  assert.equal(works[0]?.workUrl, "https://www.manga-up.com/titles/1637");
  assert.equal(works[1]?.thumbnailUrl, "https://www.manga-up.com/1153.webp");
});

test("話の一覧が読めなければ、その作品だけ作品ページに戻す", async () => {
  serve(page);

  const works = await mangaUp({ pause: 0 });

  assert.equal(works[0]?.url, "https://www.manga-up.com/titles/1637");
});

/** 区画ごと消えたら、その日を空にするのではなく壊れたと分かるようにする */
test("区画が見つからなければ例外にする", async () => {
  serve("<html><body><h2>おしらせ</h2></body></html>");

  await assert.rejects(async () => mangaUp({ pause: 0 }));
});

function section(titles: string[]): string {
  const links = titles
    .map(
      (title) =>
        `<a href="https://www.manga-up.com/titles/${title}"><img alt="${title}" src="/${title}.webp"></a>`,
    )
    .join("");

  return `<html><body><section><h2>今日の更新（土曜日）</h2><div>${links}</div></section></body></html>`;
}

/** 開くたびに違う作品を抽選で出すので、読み直して束ねる */
test("読み直して、抽選で出た作品を束ねる", async () => {
  const draws = [
    ["a", "b"],
    ["b", "c"],
    ["a", "d"],
  ];

  let read = 0;

  globalThis.fetch = (async () =>
    new Response(section(draws[read++ % draws.length] ?? []), {
      status: 200,
    })) as typeof fetch;

  const works = await mangaUp({ pause: 0 });

  assert.deepEqual(works.map((work) => work.title).toSorted(), [
    "a",
    "b",
    "c",
    "d",
  ]);
});

test("新しい作品が出なくなったら読むのをやめる", async () => {
  let read = 0;

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    // 最後に作品ページも1枚見に行くので、トップを読んだ回数だけを数える
    if (!String(input).includes("/titles/")) {
      read += 1;
    }

    return new Response(section(["a"]), { status: 200 });
  }) as typeof fetch;

  await mangaUp({ pause: 0 });

  assert.equal(read, 7);
});
