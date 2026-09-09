import assert from "node:assert/strict";
import { test } from "node:test";
import dropRepeats from "../scripts/scrape/dropRepeats.ts";
import { type Work } from "../src/types/work.ts";

const work = (url: string, workUrl?: string): Work => ({
  foundAt: "17:00",
  siteName: "ツイ４",
  siteUrl: "https://example.com/",
  thumbnailUrl: null,
  title: url,
  url,
  ...(workUrl === undefined ? {} : { workUrl }),
});

test("前の日と同じ話を指したままの作品は外す", () => {
  const works = [
    work("https://example.com/a/1", "https://example.com/a/"),
    work("https://example.com/b/2", "https://example.com/b/"),
  ];

  assert.deepEqual(dropRepeats(works, new Set(["https://example.com/a/1"])), [
    works[1],
  ]);
});

/** 一覧が話の住所をそのまま配るサイトと、作品ページ止まりのサイトには効かせない */
test("こちらで最新話を割り出していない作品は外さない", () => {
  const works = [work("https://example.com/a/")];

  assert.deepEqual(
    dropRepeats(works, new Set(["https://example.com/a/"])),
    works,
  );
});

test("前の日に無ければそのまま残す", () => {
  const works = [work("https://example.com/a/1", "https://example.com/a/")];

  assert.deepEqual(dropRepeats(works, new Set()), works);
});
