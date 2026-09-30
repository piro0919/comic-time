import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import comicBoost from "../src/app/episodes/comicBoost.ts";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

/** 作品ページを ?p= ごとに差し替える。頼まれた住所は asked に残す */
function serve(pages: Record<string, string>): { asked: string[] } {
  const asked: string[] = [];
  const bodies = new Map(Object.entries(pages));

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    const page = new URL(url).searchParams.get("p") ?? "1";

    asked.push(url);

    return url.includes("/content/00010001") && bodies.has(page)
      ? new Response(bodies.get(page), { status: 200 })
      : new Response("", { status: 404 });
  }) as typeof fetch;

  return { asked };
}

function free(id: string, title: string, date: string): string {
  return `<a id="product-${id}" class="  book-product-list-item" href="/product/0001${id}" data-id="0001${id}" data-title="${title}" data-coin="0" data-product-member="0">
<h4 class="title">${title}</h4><div class="free"><span>無料</span></div><p class="update-date">${date}</p></a>`;
}

function locked(id: string, title: string, date: string): string {
  return `<a id="product-${id}" class=" js-read book-product-list-item"  href="javascript:void(0);" data-href="/product/0001${id}?coin=26" data-id="0001${id}" data-title="${title}" data-coin="26" data-product-member="0">
<h4 class="title">${title}</h4><p class="update-date">${date}</p></a>`;
}

/** 送りの並び。ほかの作品の ?p= は数えない */
const pagination = `<ul class="pagination-list">
<li><a href="/content/00010001?p=2">2</a></li></ul>
<li><a href="/content/00010001?p=3" title="最後のページへ"></a></li>
<a href="/content/00990001?p=9">ほかの作品</a>`;

test("コミックブースト: 最後のページまで読み、無料・先読み・有料を分ける", async () => {
  const { asked } = serve({
    "1": `${locked("0006", "第6話", "2026/09/25")}${free("0005", "第5話 &amp; 番外", "2026/09/18")}${pagination}`,
    "2": locked("0004", "第4話", "2026/09/11"),
    "3": free("0001", "第1話", "2026/01/01"),
  });
  const episodes = await comicBoost("https://comic-boost.com/product/00010005");

  assert.equal(asked[0], "https://comic-boost.com/content/00010001");
  assert.equal(asked.length, 3);
  assert.deepEqual(episodes, [
    {
      access: "early",
      date: "2026-09-25",
      title: "第6話",
      url: "https://comic-boost.com/product/00010006",
    },
    {
      access: "free",
      date: "2026-09-18",
      title: "第5話 & 番外",
      url: "https://comic-boost.com/product/00010005",
    },
    {
      access: "paid",
      date: "2026-09-11",
      title: "第4話",
      url: "https://comic-boost.com/product/00010004",
    },
    {
      access: "free",
      date: "2026-01-01",
      title: "第1話",
      url: "https://comic-boost.com/product/00010001",
    },
  ]);
});

test("コミックブースト: 送りの並びが無ければ1ページだけ読む", async () => {
  const { asked } = serve({
    "1": free("0001", "第1話", "2026/09/25"),
  });
  const episodes = await comicBoost("https://comic-boost.com/content/00010001");

  assert.equal(episodes.length, 1);
  assert.equal(asked.length, 1);
});
