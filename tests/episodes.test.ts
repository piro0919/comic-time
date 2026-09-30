import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, test } from "node:test";
import comici from "../src/app/episodes/comici.ts";
import gigaViewer from "../src/app/episodes/gigaViewer.ts";
import mangaOne from "../src/app/episodes/mangaOne.ts";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

/** 住所の一部と返す中身の組で fetch を差し替える。頼まれた住所は asked に残す */
function serve(pages: [string, BodyInit | ((url: string) => BodyInit)][]): {
  asked: string[];
} {
  const asked: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    const found = pages.find(([part]) => url.includes(part));

    asked.push(url);

    if (found === undefined) {
      return new Response("", { status: 404 });
    }

    const [, body] = found;

    return new Response(typeof body === "function" ? body(url) : body, {
      status: 200,
    });
  }) as typeof fetch;

  return { asked };
}

function product(
  id: number,
  extra: Record<string, unknown>,
): Record<string, unknown> {
  return {
    display_open_at: "2026-09-12T15:00:00Z",
    is_sakiyomi: false,
    purchase_info: { can_read: false },
    status: { type: "show" },
    title: `第${id}話`,
    viewer_uri: `https://comic-gardo.com/episode/${id}`,
    ...extra,
  };
}

test("GigaViewer: 50件ずつ送り、空になったら止める", async () => {
  const first = Array.from({ length: 50 }, (_, index) =>
    product(100 - index, {}),
  );
  const second = [product(50, {})];
  const { asked } = serve([
    ["/episode/1", '<div data-aggregate-id="777"></div>'],
    [
      "pagination_readable_products",
      (url) =>
        JSON.stringify(
          url.includes("offset=0")
            ? first
            : url.includes("offset=50")
              ? second
              : [],
        ),
    ],
  ]);

  const episodes = await gigaViewer("https://comic-gardo.com/episode/1");

  assert.equal(episodes.length, 51);
  assert.ok(asked.some((url) => url.includes("aggregate_id=777")));
  assert.ok(asked.some((url) => url.includes("offset=51")));
});

test("GigaViewer: 無料・先読み・有料を分け、公開の終わった回は外す", async () => {
  serve([
    ["/episode/1", '<div data-aggregate-id="777"></div>'],
    [
      "offset=0",
      JSON.stringify([
        product(4, { is_sakiyomi: true }),
        product(3, { purchase_info: { can_read: true } }),
        product(2, {}),
        product(1, { status: { type: "private" } }),
      ]),
    ],
    ["pagination_readable_products", "[]"],
  ]);

  const episodes = await gigaViewer("https://comic-gardo.com/episode/1");

  assert.deepEqual(
    episodes.map((episode) => [episode.title, episode.access]),
    [
      ["第4話", "early"],
      ["第3話", "free"],
      ["第2話", "paid"],
    ],
  );
  // 公開日は日本の日付で出す。UTC の 15時は翌日
  assert.equal(episodes[0]?.date, "2026-09-13");
});

test("GigaViewer: 作品の番号が無ければ例外にする", async () => {
  serve([["/episode/1", "<div></div>"]]);

  await assert.rejects(
    async () => gigaViewer("https://comic-gardo.com/episode/1"),
    /作品の番号/,
  );
});

/** comici のページに埋め込まれた React の受け渡しを作る */
function comiciPage(
  episodes: { access: string; id: string; title: string }[],
  total: number,
): string {
  const flight = JSON.stringify({
    access: undefined,
    episodes: episodes.map((episode, index) => ({
      datePublished: 1790175600 + index * 86400,
      id: episode.id,
      title: episode.title,
    })),
    numEpisodes: total,
  });
  const access = episodes
    .map(
      (episode) =>
        `"access":${JSON.stringify({ accessType: episode.access, episodeId: episode.id })}`,
    )
    .join(",");
  const push = (text: string): string =>
    `<script>self.__next_f.push([1,${JSON.stringify(text)}])</script>`;

  return `<html><body>${push(flight)}${push(access)}</body></html>`;
}

test("comici: 作品ページを割り出し、全ページを古い順から新しい順に並べ替える", async () => {
  const first = Array.from({ length: 30 }, (_, index) => ({
    access: "paidContent",
    id: `a${index + 1}`,
    title: `第${index + 1}話「括弧]と\\"引用符"」`,
  }));
  const second = [
    { access: "free", id: "a31", title: "第31話" },
    { access: "paidContent", id: "a32", title: "第32話" },
  ];

  serve([
    [
      "/episodes/abc",
      '<a href="/series/list/up">一覧</a><a href="/series/0123456789ab">作品</a>',
    ],
    ["/series/0123456789ab/1", comiciPage(first, 32)],
    ["/series/0123456789ab/2", comiciPage(second, 32)],
  ]);

  const episodes = await comici("https://comicride.jp/episodes/abc");

  assert.equal(episodes.length, 32);
  assert.deepEqual(
    episodes.slice(0, 3).map((episode) => [episode.title, episode.access]),
    [
      ["第32話", "early"],
      ["第31話", "free"],
      ['第30話「括弧]と\\"引用符"」', "paid"],
    ],
  );
  assert.equal(episodes[0]?.url, "https://comicride.jp/episodes/a32");
});

test("comici: 無料の回が無ければ、先読みとは言わず全部有料にする", async () => {
  serve([
    ["/episodes/abc", '<a href="/series/0123456789ab/new">作品</a>'],
    [
      "/series/0123456789ab/1",
      comiciPage([{ access: "paidContent", id: "a1", title: "第1話" }], 1),
    ],
  ]);

  const [episode] = await comici("https://takecomic.jp/episodes/abc");

  assert.equal(episode?.access, "paid");
});

test("comici: コミプレは viewer. を外した住所で読む", async () => {
  const { asked } = serve([
    ["heros-web.com/episodes/abc", '<a href="/series/0123456789ab">作品</a>'],
    ["/series/0123456789ab/1", comiciPage([], 0)],
  ]);

  await comici("https://viewer.heros-web.com/episodes/abc");

  assert.ok(asked.every((url) => !url.includes("viewer.heros-web.com")));
});

test("マンガワン: 作品の番号で話の一覧を引き、先読みの回を見分ける", async () => {
  const { asked } = serve([
    [
      "rq=viewer_v2",
      readFileSync(new URL("./fixtures/mangaOneViewer.bin", import.meta.url)),
    ],
  ]);

  const [episode] = await mangaOne("https://manga-one.com/title/2166");

  assert.ok(asked[0]?.includes("title_id=2166"));
  assert.deepEqual(episode, {
    access: "early",
    date: "2026-10-08",
    title: "第124話 競演する",
    url: "https://manga-one.com/manga/2166/chapter/359722",
  });
});
