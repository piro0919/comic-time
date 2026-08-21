import assert from "node:assert/strict";
import { test } from "node:test";
import readReceived from "../src/app/readReceived.ts";

test("長いままの住所は、断片だけを取り出す", () => {
  assert.deepEqual(readReceived("https://comictime.kkweb.io/import#1H4sIAAA"), {
    encoded: "1H4sIAAA",
    kind: "encoded",
  });
});

test("前後の空白と改行は落とす。貼り付けで付いてくる", () => {
  assert.deepEqual(readReceived("  https://x.gd/abcd \n"), {
    kind: "url",
    url: "https://x.gd/abcd",
  });
});

test("短縮された住所は、開いて確かめるほかない", () => {
  assert.deepEqual(readReceived("https://x.gd/abcd"), {
    kind: "url",
    url: "https://x.gd/abcd",
  });
});

test("断片だけを渡されても受け取る", () => {
  assert.deepEqual(readReceived("1H4sIAAA"), {
    encoded: "1H4sIAAA",
    kind: "encoded",
  });
});

test("空と、断片の無い取り込みの住所は読み取れない", () => {
  assert.deepEqual(readReceived("   "), { kind: "unreadable" });
  assert.deepEqual(readReceived("https://comictime.kkweb.io/import#"), {
    kind: "unreadable",
  });
});
