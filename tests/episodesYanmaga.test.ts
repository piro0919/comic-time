import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import yanmaga from "../src/app/episodes/yanmaga.ts";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

/** 話の一覧の住所を差し替える。offset ごとに返す中身を変えられる。頼まれた住所は asked に残す */
function serve(pages: Record<string, string>): { asked: string[] } {
  const asked: string[] = [];
  const bodies = new Map(Object.entries(pages));

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    const offset = new URL(url).searchParams.get("offset") ?? "";

    asked.push(url);

    return url.includes("/episodes?") && bodies.has(offset)
      ? new Response(bodies.get(offset), { status: 200 })
      : new Response("", { status: 404 });
  }) as typeof fetch;

  return { asked };
}

/** サイトと同じく、1話ぶんの HTML を insertAdjacentHTML に渡す JavaScript にする */
function script(items: string[]): string {
  return [
    'var target = document.querySelector(".mod-episode-list--close");',
    ...items.map(
      (html) =>
        `target.insertAdjacentHTML('beforeend', ${JSON.stringify(html).replaceAll("/", "\\/")})`,
    ),
  ].join("\n");
}

function item(
  hash: string,
  {
    date = "2026/09/28",
    isFree = false,
    modal = false,
    title = hash,
  }: { date?: string; isFree?: boolean; modal?: boolean; title?: string },
): string {
  return `<li class="mod-episode-item${modal ? " js-modal" : ""}" data-episode-title="${title}" data-is-free="${String(isFree)}" data-modal="registration" data-original-url="/comics/%E4%BD%9C%E5%93%81/${hash}">
<a class="mod-episode-link" href="/comics/%E4%BD%9C%E5%93%81/${hash}"><time class="mod-episode-date">${date}</time>
<p class="mod-episode-title">${title}</p></a></li>`;
}

test("ヤンマガWeb: 無料・会員の無料・先読み・有料を分ける", async () => {
  const { asked } = serve({
    "0": script([
      item("e5", { modal: true, title: "第５話／罠&amp;鍵" }),
      item("e4", { date: "2026/09/21" }),
      item("e3", { isFree: true, modal: true }),
      item("e2", { modal: true }),
      item("e1", { date: "2025/03/17" }),
    ]),
  });
  const episodes = await yanmaga(
    "https://yanmaga.jp/comics/%E4%BD%9C%E5%93%81/e1",
  );

  assert.ok(
    asked[0]?.startsWith(
      "https://yanmaga.jp/comics/%E4%BD%9C%E5%93%81/episodes?",
    ),
  );
  assert.ok(asked[0]?.includes("sort=newer"));
  assert.deepEqual(episodes, [
    {
      access: "early",
      date: "2026-09-28",
      title: "第５話／罠&鍵",
      url: "https://yanmaga.jp/comics/%E4%BD%9C%E5%93%81/e5",
    },
    {
      access: "free",
      date: "2026-09-21",
      title: "e4",
      url: "https://yanmaga.jp/comics/%E4%BD%9C%E5%93%81/e4",
    },
    // 会員なら無料の回は、ログインが要るので無料とは言わない
    {
      access: "paid",
      date: "2026-09-28",
      title: "e3",
      url: "https://yanmaga.jp/comics/%E4%BD%9C%E5%93%81/e3",
    },
    {
      access: "paid",
      date: "2026-09-28",
      title: "e2",
      url: "https://yanmaga.jp/comics/%E4%BD%9C%E5%93%81/e2",
    },
    {
      access: "free",
      date: "2025-03-17",
      title: "e1",
      url: "https://yanmaga.jp/comics/%E4%BD%9C%E5%93%81/e1",
    },
  ]);
});

test("ヤンマガWeb: 頼んだ数だけ返ったら次を読み、足りなければ止める", async () => {
  const first = Array.from({ length: 150 }, (_, index) =>
    item(`n${200 - index}`, {}),
  );
  const { asked } = serve({
    "0": script(first),
    "150": script([item("n50", {})]),
  });
  const episodes = await yanmaga(
    "https://yanmaga.jp/comics/%E4%BD%9C%E5%93%81",
  );

  assert.equal(episodes.length, 151);
  assert.equal(episodes[150]?.title, "n50");
  assert.equal(asked.length, 2);
});
