import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, test } from "node:test";
import mangaOne from "../scripts/scrape/sources/mangaOne.ts";

const home = readFileSync(
  new URL("./fixtures/mangaOneHome.bin", import.meta.url),
);
const realFetch = globalThis.fetch;

/** 更新一覧は protobuf、作品ページは HTML と、2種類を返し分ける */
function serveWith(page: string): void {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    if (String(input).includes("/api/client")) {
      return new Response(home, { status: 200 });
    }

    return new Response(page, { status: 200 });
  }) as typeof fetch;
}

after(() => {
  globalThis.fetch = realFetch;
});

/** 曜日の枠には更新の無い作品も並ぶので、印の付いたものだけを取る */
test("今日の枠のうち、更新の印が付いた作品だけを返す", async () => {
  serveWith("");

  const works = await mangaOne("2026-08-21");

  // 応答の題名は濁点が別の文字で来る。見た目で比べられるよう揃えてから見る
  assert.deepEqual(
    works.map((work) => work.title.normalize("NFC")),
    [
      "最強女師匠たちが育成方針を巡って修羅場",
      "薬屋のひとりごと〜猫猫の後宮謎解き手帳〜",
      "負けヒロインが多すぎる！@comic",
    ],
  );
  works.forEach((work) => {
    assert.match(work.url, /^https:\/\/manga-one\.com\/title\/\d+$/);
  });
});

/**
 * 応答にサムネイルが入るのは順位表に載っている作品だけ。
 * 無いものは作品ページの og:image から拾う。実体参照は戻す。
 */
test("応答に絵が無い作品は、作品ページから拾う", async () => {
  serveWith(
    '<meta property="og:image" content="https://example.test/a.jpg&amp;sig=1">',
  );

  const works = await mangaOne("2026-08-21");

  assert.equal(
    works[0].thumbnailUrl?.startsWith("https://app.manga-one.com/"),
    true,
  );
  assert.equal(works[2].thumbnailUrl, "https://example.test/a.jpg&sig=1");
});

test("作品ページから拾えなければ、その作品だけ絵を諦める", async () => {
  serveWith("<html><head></head></html>");

  const works = await mangaOne("2026-08-21");

  assert.equal(works[2].thumbnailUrl, null);
});

test("今日の枠が無い日は空になる", async () => {
  serveWith("");

  const works = await mangaOne("2026-08-20");

  assert.deepEqual(works, []);
});

test("更新一覧の節が無ければ例外にする", async () => {
  globalThis.fetch = (async () =>
    new Response(new Uint8Array([]), { status: 200 })) as typeof fetch;

  await assert.rejects(async () => mangaOne("2026-08-21"), /更新一覧の節/);
});

test("取れなかったときは例外にする", async () => {
  globalThis.fetch = (async () =>
    new Response("", {
      status: 503,
      statusText: "Service Unavailable",
    })) as typeof fetch;

  await assert.rejects(async () => mangaOne("2026-08-21"), /503/);
});
