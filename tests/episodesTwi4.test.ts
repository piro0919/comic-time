import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import twi4 from "../src/app/episodes/twi4.ts";

const realFetch = globalThis.fetch;
const work = "https://sai-zen-sen.jp/comics/twi4/yojouhan/";

afterEach(() => {
  globalThis.fetch = realFetch;
});

/** 作品ページだけを差し替える。頼まれた住所は asked に残す */
function serve(html: string): { asked: string[] } {
  const asked: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    asked.push(url);

    return url === work
      ? new Response(html, { status: 200 })
      : new Response("", { status: 404 });
  }) as typeof fetch;

  return { asked };
}

const page = `<nav id="backnumbers"><ul>
  <li><a href="${work}0209.html">水藤流『張り合い』 #0209</a></li>
  <li><a href="0208.html">特別編</a></li>
</ul></nav>`;

test("ツイ４: 話の住所から作品ページを割り出し、バックナンバーを並びのまま出す", async () => {
  const { asked } = serve(page);
  const episodes = await twi4(`${work}0001.html`);

  assert.deepEqual(asked, [work]);
  assert.deepEqual(episodes, [
    {
      access: "free",
      date: null,
      title: "#0209 張り合い",
      url: `${work}0209.html`,
    },
    { access: "free", date: null, title: "特別編", url: `${work}0208.html` },
  ]);
});

test("ツイ４: バックナンバーが無ければ例外にする", async () => {
  serve("<div></div>");

  await assert.rejects(async () => twi4(work), /バックナンバー/);
});
