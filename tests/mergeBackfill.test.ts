import assert from "node:assert/strict";
import { test } from "node:test";
import mergeBackfill from "../scripts/catalog/mergeBackfill.ts";
import { type CatalogEntry } from "../src/types/work.ts";

function entryWith(
  updates: string[],
  firstSeen: string,
  lastSeen: string,
): CatalogEntry {
  return {
    dayBits: 0,
    firstSeen,
    lastSeen,
    sites: [],
    slug: "a",
    thumbnailUrl: null,
    title: "a",
    updates,
  };
}

test("書き起こした日を足し、重複を除いて古い順にする", () => {
  const merged = mergeBackfill(
    entryWith(["2026-08-28", "2026-08-25"], "2026-08-25", "2026-08-28"),
    ["2026-08-17", "2026-08-25"],
  );

  assert.deepEqual(merged.updates, ["2026-08-17", "2026-08-25", "2026-08-28"]);
  assert.equal(merged.firstSeen, "2026-08-17");
});

test("同じ回が載り続けた日まで進んだ lastSeen を、履歴の最後へ戻す", () => {
  // 相棒に毒がありまして！は、8/28 の回が 9/9 まで載り続け、lastSeen だけ 9/9 になっていた
  const merged = mergeBackfill(
    entryWith(["2026-08-17", "2026-08-28"], "2026-08-17", "2026-09-09"),
    [],
  );

  assert.equal(merged.lastSeen, "2026-08-28");
});

test("履歴が空なら lastSeen と firstSeen はそのまま", () => {
  const merged = mergeBackfill(entryWith([], "2026-08-30", "2026-08-30"), []);

  assert.equal(merged.firstSeen, "2026-08-30");
  assert.equal(merged.lastSeen, "2026-08-30");
});
