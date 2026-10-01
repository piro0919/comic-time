import assert from "node:assert/strict";
import { test } from "node:test";
import { goneOf, migrationNames, pendingOf } from "../scripts/migrate/plan.ts";

test("番号の付いた .sql だけを番号順に並べる", () => {
  assert.deepEqual(
    migrationNames(["0002_b.sql", "README.md", "0001_a.sql", "draft.sql"]),
    ["0001_a", "0002_b"],
  );
});

test("記録に無いものだけを当てる", () => {
  assert.deepEqual(
    pendingOf(["0001_a", "0002_b", "0003_c"], new Set(["0001_a", "0002_b"])),
    ["0003_c"],
  );
});

test("記録にあってファイルが無いものを挙げる", () => {
  assert.deepEqual(goneOf(["0001_a"], new Set(["0001_a", "0000_x"])), [
    "0000_x",
  ]);
});
