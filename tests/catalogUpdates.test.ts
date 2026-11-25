import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { type CatalogEntry } from "../src/types/work.ts";

/**
 * 作品ページは「最後の更新」に lastSeen を、間隔と「更新を見つけた日」に updates を使う。
 * 2つがずれると、同じページの中で最後の更新日と履歴が食い違う。
 * 9/9 まで同じ回が載り続けた作品で、lastSeen だけが 9/9 に進んでいたことがある（2026-11-26 に直した）
 */
const catalog = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data", "catalog.json"), "utf-8"),
) as CatalogEntry[];

test("台帳の lastSeen は、更新を見つけた日の最後と一致する", () => {
  const mismatched = catalog
    .filter(
      (entry) =>
        entry.updates.length > 0 && entry.updates.at(-1) !== entry.lastSeen,
    )
    .map((entry) => `${entry.title}: ${entry.lastSeen}`);

  assert.deepEqual(mismatched, []);
});

test("台帳の更新を見つけた日は、古い順で重複が無い", () => {
  const unsorted = catalog
    .filter((entry) =>
      entry.updates.some(
        (date, index) => index > 0 && date <= entry.updates[index - 1],
      ),
    )
    .map((entry) => entry.title);

  assert.deepEqual(unsorted, []);
});
