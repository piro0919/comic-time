import assert from "node:assert/strict";
import { test } from "node:test";
import searchIndex from "../src/lib/searchIndex.ts";
import { catalog } from "../src/lib/workCatalog.ts";

test("every site of every catalog work can be searched", () => {
  const { siteUrls, works } = searchIndex();
  const indexed = new Set(
    works.map(
      ([title, url, siteIndex]) =>
        `${title}\u0000${url}\u0000${siteUrls[siteIndex]}`,
    ),
  );
  const expected = catalog().flatMap((entry) =>
    entry.sites.map(
      (site) => `${entry.title}\u0000${site.url}\u0000${site.siteUrl}`,
    ),
  );

  assert.ok(expected.length > 0);
  assert.equal(works.length, expected.length);
  expected.forEach((key) => {
    assert.ok(indexed.has(key), key);
  });
});

test("a work keeps the weekdays it was seen on", () => {
  const { works } = searchIndex();
  const entry = catalog().find((item) => item.dayBits !== 0);

  assert.ok(entry !== undefined);
  assert.ok(
    works.some(
      ([title, , , dayBits]) =>
        title === entry.title && dayBits === entry.dayBits,
    ),
  );
});
