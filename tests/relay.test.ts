import { NextRequest } from "next/server";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { GET } from "../src/app/api/relay/route.ts";
import { serve } from "./serve.ts";

const target = "https://championcross.jp/category/manga/day/1/1";

async function ask(url: string, token?: string): Promise<Response> {
  return GET(
    new NextRequest(
      `https://comictime.kkweb.io/api/relay?url=${encodeURIComponent(url)}`,
      {
        headers:
          token === undefined ? {} : { Authorization: `Bearer ${token}` },
      },
    ),
  );
}

afterEach(() => {
  delete process.env.SCRAPE_RELAY_TOKEN;
});

test("合言葉が設定されていなければ口ごと無いことにする", async () => {
  assert.equal((await ask(target, "")).status, 404);
});

test("合言葉が違えば断る", async () => {
  process.env.SCRAPE_RELAY_TOKEN = "secret";

  assert.equal((await ask(target, "wrong")).status, 404);
  assert.equal((await ask(target)).status, 404);
});

/** 誰でも使える転送口にしない */
test("台帳に無いサイトは読みに行かない", async () => {
  process.env.SCRAPE_RELAY_TOKEN = "secret";

  const served = serve({});

  try {
    assert.equal((await ask("https://example.com/", "secret")).status, 400);
    assert.deepEqual(served.asked, []);
  } finally {
    served.restore();
  }
});

test("台帳のサイトは読んだ中身をそのまま返す", async () => {
  process.env.SCRAPE_RELAY_TOKEN = "secret";

  const served = serve({ "/day/1/1": "championCross2.html" });

  try {
    const res = await ask(target, "secret");

    assert.equal(res.status, 200);
    assert.match(await res.text(), /series-list-item/);
    assert.deepEqual(served.asked, [target]);
  } finally {
    served.restore();
  }
});
