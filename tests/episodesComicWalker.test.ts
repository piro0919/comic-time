import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import comicWalker from "../src/app/episodes/comicWalker.ts";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

/** 作品詳細の API だけを差し替える。頼まれた住所は asked に残す */
function serve(body: unknown): { asked: string[] } {
  const asked: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    asked.push(url);

    return url.includes("/api/contents/details/work")
      ? new Response(JSON.stringify(body), { status: 200 })
      : new Response("", { status: 404 });
  }) as typeof fetch;

  return { asked };
}

function episode(
  code: string,
  extra: Record<string, unknown>,
): Record<string, unknown> {
  return {
    code,
    isActive: true,
    subTitle: "",
    title: code,
    type: "normal",
    updateDate: "2026-09-25T15:00:00Z",
    ...extra,
  };
}

test("カドコミ: 公開中の話を並びのまま無料で出し、公開終了と告知は外す", async () => {
  const { asked } = serve({
    latestEpisodes: {
      result: [
        episode("E4", { subTitle: "決戦" }),
        episode("E3", { isActive: false }),
        episode("PR", { type: "pr" }),
        episode("E1", { updateDate: "2026-01-01T02:00:00Z" }),
      ],
    },
  });
  const episodes = await comicWalker(
    "https://comic-walker.com/detail/KC_000028_S/episodes/KC_0000280004900021_E",
  );

  assert.ok(asked[0]?.includes("workCode=KC_000028_S"));
  assert.deepEqual(episodes, [
    {
      access: "free",
      // UTC の 15時は日本では翌日
      date: "2026-09-26",
      title: "E4 決戦",
      url: "https://comic-walker.com/detail/KC_000028_S/episodes/E4",
    },
    {
      access: "free",
      date: "2026-01-01",
      title: "E1",
      url: "https://comic-walker.com/detail/KC_000028_S/episodes/E1",
    },
  ]);
});

test("カドコミ: 作品の符号が無い住所は例外にする", async () => {
  serve({});

  await assert.rejects(
    async () => comicWalker("https://web-ace.jp/youngaceup/"),
    /作品の符号/,
  );
});

test("カドコミ: 話の一覧が返らなければ例外にする", async () => {
  serve({ work: {} });

  await assert.rejects(
    async () => comicWalker("https://comic-walker.com/detail/KC_000028_S"),
    /話の一覧/,
  );
});
