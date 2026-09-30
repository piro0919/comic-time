import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import shuro from "../src/app/episodes/shuro.ts";

const realFetch = globalThis.fetch;
const work = "https://shuro.world/manga/delicious/";

afterEach(() => {
  globalThis.fetch = realFetch;
});

/** 住所と返す中身の組で fetch を差し替える。頼まれた住所は asked に残す */
function serve(pages: Record<string, string>): { asked: string[] } {
  const asked: string[] = [];
  const bodies = new Map(Object.entries(pages));

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    const body = bodies.get(url);

    asked.push(url);

    return body === undefined
      ? new Response("", { status: 404 })
      : new Response(body, { status: 200 });
  }) as typeof fetch;

  return { asked };
}

function card(id: number, title: string, sub = ""): string {
  return `<a href="https://shuro.world/episode/${id}/"><img alt=""><p><b>${title}</b></p>${sub === "" ? "" : `<p>${sub}</p>`}</a>`;
}

const workPage = `<div><a href="https://shuro.world/episode/999/">おすすめ</a></div>
<div class="rowm-8">
  <div class="flex"><h3>エピソード一覧</h3><p>最終更新: 2026年8月24日</p></div>
  <div class="line-container">
    ${card(72071, "第１話", "「始まり」")}${card(92862, "第１４話")}${card(73387, "第２話")}
  </div>
</div>`;

test("SHURO: エピソード一覧だけを読み、投稿の番号で新しい順に並べ直す", async () => {
  serve({ [work]: workPage });

  const episodes = await shuro(work);

  assert.deepEqual(
    episodes.map((episode) => [episode.title, episode.url]),
    [
      ["第１４話", "https://shuro.world/episode/92862/"],
      ["第２話", "https://shuro.world/episode/73387/"],
      ["第１話 「始まり」", "https://shuro.world/episode/72071/"],
    ],
  );
  assert.ok(
    episodes.every(
      (episode) => episode.access === "free" && episode.date === null,
    ),
  );
});

test("SHURO: 話の住所なら、画面上の作品への道から作品ページへ行く", async () => {
  const { asked } = serve({
    "https://shuro.world/episode/92862/": `<a href="https://shuro.world/manga/type/isekai/">分類</a><a class="viewer-top" href="${work}">作品</a>`,
    [work]: workPage,
  });
  const episodes = await shuro("https://shuro.world/episode/92862/");

  assert.equal(episodes.length, 3);
  assert.equal(asked[1], work);
});

test("SHURO: 作品ページが見つからなければ例外にする", async () => {
  serve({ "https://shuro.world/episode/1/": "<div></div>" });

  await assert.rejects(
    async () => shuro("https://shuro.world/episode/1/"),
    /作品ページ/,
  );
});
