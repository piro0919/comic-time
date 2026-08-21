import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import getsumagakichi from "../scripts/scrape/sources/getsumagakichi.ts";
import { serve } from "./serve.ts";

let served = serve({});

before(() => {
  served = serve({ "getsumagakichi.com": "getsumagakichi.html" });
});

after(() => {
  served.restore();
});

/**
 * 区画に目印が無いので、日付の見出しを1つだけ含む一番外側の祖先を区画とみなす。
 * 登りすぎると隣の日まで入り、登り足りないと作品を取りこぼす。
 */
test("見出しの区画にある作品だけを返す", async () => {
  const latest = await getsumagakichi("2026-08-18");
  const previous = await getsumagakichi("2026-08-14");

  assert.equal(latest.length, 8);
  assert.ok(
    latest.map((work) => work.title).includes("卒業アルバムの彼女たち"),
  );
  assert.equal(previous.length, 7);
  assert.deepEqual(
    latest.filter((work) =>
      previous.some((other) => other.title === work.title),
    ),
    [],
  );
});

test("見出しが無い日は空になる", async () => {
  const works = await getsumagakichi("2026-08-21");

  assert.deepEqual(works, []);
});

/** 作品の実体は comic-days.com にあり、同じ話へのリンクが何度も出る */
test("同じ話は1件にまとめ、話の住所で返す", async () => {
  const works = await getsumagakichi("2026-08-18");
  const urls = works.map((work) => work.url);

  assert.equal(new Set(urls).size, urls.length);
  urls.forEach((url) => {
    assert.match(url, /^https:\/\/comic-days\.com\/episode\//);
    assert.ok(!url.includes("?"));
  });
});
