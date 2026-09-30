import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import ganganOnline from "../src/app/episodes/ganganOnline.ts";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

/** 作品ページだけを差し替える。頼まれた住所は asked に残す */
function serve(chapters: unknown[]): { asked: string[] } {
  const asked: string[] = [];
  const nextData = JSON.stringify({
    props: { pageProps: { data: { default: { chapters } } } },
  });

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    asked.push(url);

    return url.endsWith("/title/2385")
      ? new Response(
          `<script id="__NEXT_DATA__" type="application/json">${nextData}</script>`,
          { status: 200 },
        )
      : new Response("", { status: 404 });
  }) as typeof fetch;

  return { asked };
}

test("ガンガンONLINE: Web で読める回だけを並びのまま出し、アプリ先行と公開終了は外す", async () => {
  const { asked } = serve([
    {
      id: 128208,
      mainText: "次回更新：10月5日",
      status: 3,
      subText: "第9話-3 憧れに約束",
    },
    {
      id: 127431,
      mainText: "第9話-2",
      publishingPeriod: "2026.09.21〜2026.10.04",
      subText: "憧れに約束",
    },
    {
      id: 126861,
      mainText: "第9話-1",
      publishingPeriod: "2026.08.24〜2026.09.20",
      status: 2,
    },
    { id: 116040, mainText: "第1話", subText: " " },
  ]);
  const episodes = await ganganOnline(
    "https://www.ganganonline.com/title/2385/chapter/127431",
  );

  assert.equal(asked[0], "https://www.ganganonline.com/title/2385");
  assert.deepEqual(episodes, [
    {
      access: "free",
      date: "2026-09-21",
      title: "第9話-2 憧れに約束",
      url: "https://www.ganganonline.com/title/2385/chapter/127431",
    },
    {
      access: "free",
      date: null,
      title: "第1話",
      url: "https://www.ganganonline.com/title/2385/chapter/116040",
    },
  ]);
});

test("ガンガンONLINE: __NEXT_DATA__ が無ければ例外にする", async () => {
  globalThis.fetch = (async () =>
    new Response("<html></html>", { status: 200 })) as typeof fetch;

  await assert.rejects(
    async () => ganganOnline("https://www.ganganonline.com/title/2385"),
    /__NEXT_DATA__/,
  );
});
