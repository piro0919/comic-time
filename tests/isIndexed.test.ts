import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import { withDate } from "../scripts/catalog/index.ts";
import isIndexed, { minUpdatesToIndex } from "../src/lib/isIndexed.ts";
import { catalog } from "../src/lib/workCatalog.ts";
import { type CatalogEntry } from "../src/types/work.ts";

const require = createRequire(import.meta.url);
const sitemapConfig = require("../next-sitemap.config.js") as {
  additionalPaths: (conf: {
    transform: (conf: unknown, loc: string) => Promise<string>;
  }) => Promise<string[]>;
};

function entryWith(updates: string[]): CatalogEntry {
  return {
    dayBits: 0,
    firstSeen: "2026-11-01",
    lastSeen: "2026-11-01",
    sites: [],
    slug: "a",
    thumbnailUrl: null,
    title: "a",
    updates,
  };
}

test("更新を3回見つけた作品から検索に出す", () => {
  assert.equal(isIndexed(entryWith(["2026-11-01", "2026-11-08"])), false);
  assert.equal(
    isIndexed(entryWith(["2026-11-01", "2026-11-08", "2026-11-15"])),
    true,
  );
});

test("同じ日が重なっても1回と数える。間隔の判定が出ないページは検索に出さない", () => {
  assert.equal(
    isIndexed(entryWith(["2026-11-01", "2026-11-08", "2026-11-08"])),
    false,
  );
});

test("サイトマップには検索に出す作品ページだけを載せる", async () => {
  const paths = await sitemapConfig.additionalPaths({
    transform: async (_conf, loc) => Promise.resolve(loc),
  });
  const expected = catalog()
    .filter(isIndexed)
    .map((entry) => `/works/${entry.slug}`);

  assert.ok(expected.length > 0);
  assert.ok(expected.length < catalog().length);
  assert.deepEqual(paths, expected);
});

test("台帳の作品はどれも更新の日を持つ", () => {
  assert.ok(catalog().every((entry) => entry.updates.length > 0));
  assert.ok(minUpdatesToIndex > 1);
});

test("同じ日に何度取得しても、更新は1回に数える", () => {
  assert.deepEqual(withDate(["2026-11-01"], "2026-11-01"), ["2026-11-01"]);
  assert.deepEqual(withDate(["2026-11-08"], "2026-11-01"), [
    "2026-11-01",
    "2026-11-08",
  ]);
});
