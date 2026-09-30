import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import magazinePocket, {
  mangaHash,
} from "../src/app/episodes/magazinePocket.ts";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

type Asked = { body: string; hash: string; url: string };

/** 作品の詳細と話の一覧の API を差し替える。頼まれた中身は asked に残す */
function serve(ids: number[], episodes: Record<string, unknown>[]): Asked[] {
  const asked: Asked[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const headers = (init?.headers ?? {}) as Record<string, string>;
    const body = String(init?.body ?? "");

    asked.push({ body, hash: headers["x-manga-hash"] ?? "", url });

    if (url.includes("/web/title/detail")) {
      return new Response(
        JSON.stringify({ web_title: { episode_id_list: ids } }),
        { status: 200 },
      );
    }

    if (url.includes("/episode/list")) {
      const wanted = new Set(
        (new URLSearchParams(body).get("episode_id_list") ?? "")
          .split(",")
          .map(Number),
      );

      return new Response(
        JSON.stringify({
          episode_list: episodes.filter((episode) =>
            wanted.has(episode.episode_id as number),
          ),
        }),
        { status: 200 },
      );
    }

    return new Response("", { status: 404 });
  }) as typeof fetch;

  return asked;
}

function episode(
  id: number,
  extra: Record<string, unknown>,
): Record<string, unknown> {
  return {
    episode_id: id,
    episode_name: `【第${id}話】`,
    point: 75,
    start_time: "2026-09-16 00:00:00",
    use_status: 4,
    ...extra,
  };
}

test("マガポケ: 頼む中身から x-manga-hash を作る", () => {
  // 本物の API が受け付けた値（2026-09-30）
  assert.equal(
    mangaHash({ title_id: "1872" }),
    "851284e336e5d123007f3c389d1dd064760c2598157a529d3022cdbbc65bb3c3dd131ed4fb5290d955b0a47d27636cbd9ba5670afde6aeb36acf9a9017ffe1eb",
  );
  assert.notEqual(
    mangaHash({ title_id: "1872" }),
    mangaHash({ title_id: "1873" }),
  );
});

test("マガポケ: 新しい順に並べ、無料・先読み・有料を分ける", async () => {
  const asked = serve(
    [1, 2, 3, 4, 5],
    [
      // 返ってくる順は番号の順と限らない
      episode(5, { point: 90, start_time: null, use_status: 1 }),
      episode(1, { point: 0, use_status: 3 }),
      episode(4, { point: 0, use_status: 1 }),
      episode(3, { use_status: 1 }),
      episode(2, {}),
    ],
  );
  const episodes = await magazinePocket(
    "https://pocket.shonenmagazine.com/title/01872/episode/2",
  );

  assert.deepEqual(
    episodes.map((item) => [item.title, item.access, item.date]),
    [
      ["【第5話】", "early", null],
      ["【第4話】", "free", "2026-09-16"],
      // use_status 1 でも、一番新しい無料の回より古ければ先読みではない
      ["【第3話】", "paid", "2026-09-16"],
      ["【第2話】", "paid", "2026-09-16"],
      ["【第1話】", "free", "2026-09-16"],
    ],
  );
  assert.equal(
    episodes[0]?.url,
    "https://pocket.shonenmagazine.com/title/01872/episode/5",
  );
  // 作品の番号は頭の0を外して渡し、同じ中身から印を作る
  assert.ok(asked[0]?.url.includes("title_id=1872"));
  assert.equal(asked[0]?.hash, mangaHash({ title_id: "1872" }));
  assert.equal(asked[1]?.hash, mangaHash({ episode_id_list: "1,2,3,4,5" }));
});

test("マガポケ: 話の番号は50件ずつに分けて頼む", async () => {
  const ids = Array.from({ length: 120 }, (_, index) => index + 1);
  const asked = serve(
    ids,
    ids.map((id) => episode(id, { point: 0 })),
  );
  const episodes = await magazinePocket(
    "https://pocket.shonenmagazine.com/title/00001/episode/1",
  );

  assert.equal(episodes.length, 120);
  assert.equal(episodes[0]?.title, "【第120話】");
  assert.equal(
    asked.filter((request) => request.url.includes("/episode/list")).length,
    3,
  );
});
