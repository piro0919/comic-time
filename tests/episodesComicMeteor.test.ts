import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import comicMeteor from "../src/app/episodes/comicMeteor.ts";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

/** 作品ページだけを差し替える。頼まれた住所は asked に残す */
function serve(html: string): { asked: string[] } {
  const asked: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    asked.push(url);

    return url.endsWith("/meteor/titles/aroundforty")
      ? new Response(html, { status: 200 })
      : new Response("", { status: 404 });
  }) as typeof fetch;

  return { asked };
}

function readable(id: string, title: string): string {
  return `<div class="episode-item">
  <div class="episode-item-left my-2 my-lg-0">
    <div class="fw-bold fs-6 me-1">${title}</div>
    <div>掲載期間：10月21日まで</div>
  </div>
  <div class="episode-item-right">
    <a id="${id}" class="button-pink episode-item-button episode-read" href="https://kirapo.jp/pt/meteor/aroundforty/${id}/viewer" data-episode-id="${id}">読む</a>
  </div>
</div>`;
}

const ended = `<div class="episode-item">
  <div class="episode-item-left my-2 my-lg-0"><span>第44話の公開は終了しました。</span></div>
</div>`;
const unreleased = `<div class="episode-item">
  <div class="episode-item-left my-2 my-lg-0"><div class="fw-bold fs-6 me-1">未公開話</div></div>
  <div class="episode-item-right phone-disable">
    <a class="button-black episode-item-button" href="https://booklive.jp/product/index/title_id/1/vol_no/001">ブックライブで購入</a>
  </div>
</div>`;

test("COMICメテオ: 読める回だけを並びのまま無料で出し、未公開と公開終了は外す", async () => {
  const { asked } = serve(
    [
      unreleased,
      readable("2022923", "第45話"),
      ended,
      readable("2022179", "特別編 &amp; おまけ"),
      readable("1017660", "第1話"),
    ].join("\n"),
  );
  const episodes = await comicMeteor(
    "https://kirapo.jp/pt/meteor/aroundforty/1017660/viewer",
  );

  assert.equal(asked[0], "https://kirapo.jp/meteor/titles/aroundforty");
  assert.deepEqual(episodes, [
    {
      access: "free",
      date: null,
      title: "第45話",
      url: "https://kirapo.jp/pt/meteor/aroundforty/2022923/viewer",
    },
    {
      access: "free",
      date: null,
      title: "特別編 & おまけ",
      url: "https://kirapo.jp/pt/meteor/aroundforty/2022179/viewer",
    },
    {
      access: "free",
      date: null,
      title: "第1話",
      url: "https://kirapo.jp/pt/meteor/aroundforty/1017660/viewer",
    },
  ]);
});
