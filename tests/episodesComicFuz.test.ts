import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import comicFuz from "../src/app/episodes/comicFuz.ts";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

/** 住所の一部と返す中身の組で fetch を差し替える。頼まれた住所は asked に残す */
function serve(pages: [string, string][]): { asked: string[] } {
  const asked: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    const found = pages.find(([part]) => url.endsWith(part));

    asked.push(url);

    return found === undefined
      ? new Response("", { status: 404 })
      : new Response(found[1], { status: 200 });
  }) as typeof fetch;

  return { asked };
}

function nextData(pageProps: unknown): string {
  return `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps } })}</script>`;
}

const mangaPage = nextData({
  chapters: [
    {
      chapters: [
        {
          badge: 2,
          chapterId: 4,
          chapterMainName: "4話",
          pointConsumption: { amount: 60, type: 1 },
          updatedDate: "2026/10/09",
        },
        {
          chapterId: 3,
          chapterMainName: "3話",
          pointConsumption: { amount: 30 },
          updatedDate: "2026/09/25",
        },
      ],
    },
    {
      chapters: [
        {
          chapterId: 1,
          chapterMainName: "1話",
          chapterSubName: "プロローグ",
          pointConsumption: {},
          updatedDate: "2025/09/07",
        },
      ],
    },
  ],
});

test("COMIC FUZ: 巻の束をまたいで新しい順に並べ、先読み・有料・無料を分ける", async () => {
  serve([["/manga/3818", mangaPage]]);

  const episodes = await comicFuz("https://comic-fuz.com/manga/3818");

  assert.deepEqual(episodes, [
    {
      access: "early",
      date: "2026-10-09",
      title: "4話",
      url: "https://comic-fuz.com/manga/viewer/4",
    },
    {
      access: "paid",
      date: "2026-09-25",
      title: "3話",
      url: "https://comic-fuz.com/manga/viewer/3",
    },
    {
      access: "free",
      date: "2025-09-07",
      title: "1話 プロローグ",
      url: "https://comic-fuz.com/manga/viewer/1",
    },
  ]);
});

test("COMIC FUZ: 読む画面の住所なら、埋め込みの mangaId から作品ページへ行く", async () => {
  const { asked } = serve([
    ["/manga/viewer/80095", nextData({ data: { mangaId: 3818 } })],
    ["/manga/3818", mangaPage],
  ]);
  const episodes = await comicFuz("https://comic-fuz.com/manga/viewer/80095");

  assert.equal(episodes.length, 3);
  assert.equal(asked[1], "https://comic-fuz.com/manga/3818");
});

test("COMIC FUZ: 話の一覧が無ければ例外にする", async () => {
  serve([["/manga/3818", nextData({})]]);

  await assert.rejects(
    async () => comicFuz("https://comic-fuz.com/manga/3818"),
    /話の一覧/,
  );
});
