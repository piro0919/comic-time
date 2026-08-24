import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import resolveEpisodes, {
  forget,
  remember,
} from "../scripts/scrape/resolveEpisodes.ts";
import { type ParsedWork } from "../src/types/work.ts";

const work = (url: string): ParsedWork => ({
  thumbnailUrl: null,
  title: url,
  url,
});

afterEach(() => {
  forget();
});

test("調べた話の住所に差し替え、元の作品ページを控える", async () => {
  const works = await resolveEpisodes(
    [work("https://example.com/a")],
    async () => Promise.resolve("https://example.com/a/1"),
  );

  assert.deepEqual(works, [
    {
      thumbnailUrl: null,
      title: "https://example.com/a",
      url: "https://example.com/a/1",
      workUrl: "https://example.com/a",
    },
  ]);
});

/** 取得は日に4回走る。同じ日に一度調べた作品は、もう作品ページを見に行かない */
test("同じ日に調べた作品は調べ直さない", async () => {
  remember([
    { url: "https://example.com/a/1", workUrl: "https://example.com/a" },
  ]);

  const asked: string[] = [];
  const works = await resolveEpisodes(
    [work("https://example.com/a")],
    async (url) => {
      asked.push(url);

      return Promise.resolve("https://example.com/a/2");
    },
  );

  assert.deepEqual(asked, []);
  assert.equal(works[0].url, "https://example.com/a/1");
});

test("覚えていない作品は調べに行く", async () => {
  remember([
    { url: "https://example.com/b/1", workUrl: "https://example.com/b" },
  ]);

  const asked: string[] = [];

  await resolveEpisodes([work("https://example.com/a")], async (url) => {
    asked.push(url);

    return Promise.resolve("https://example.com/a/1");
  });

  assert.deepEqual(asked, ["https://example.com/a"]);
});

/** 読み取れなかった作品は作品ページのまま。控えも付けず、次の回にまた調べる */
test("読み取れなければ作品ページのままにする", async () => {
  const works = await resolveEpisodes(
    [work("https://example.com/a")],
    async () => Promise.resolve(null),
  );

  assert.deepEqual(works, [work("https://example.com/a")]);
});

test("覚え直すと前のぶんは捨てる", async () => {
  remember([
    { url: "https://example.com/a/1", workUrl: "https://example.com/a" },
  ]);
  remember([]);

  const asked: string[] = [];

  await resolveEpisodes([work("https://example.com/a")], async (url) => {
    asked.push(url);

    return Promise.resolve("https://example.com/a/2");
  });

  assert.deepEqual(asked, ["https://example.com/a"]);
});
