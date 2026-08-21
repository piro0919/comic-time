import assert from "node:assert/strict";
import { test } from "node:test";
import { readFields, stringOf } from "../scripts/scrape/protobuf.ts";

/** 欄番号と種別を1バイトにまとめたもの。種別0は数、種別2は長さ付きのバイト列 */
const tag = (number: number, wireType: number): number => number * 8 + wireType;

function bytesOf(text: string): number[] {
  return [...new TextEncoder().encode(text)];
}

test("種別0の欄は数として読む", () => {
  const fields = readFields(new Uint8Array([tag(1, 0), 42]));

  assert.deepEqual(fields, [{ number: 1, value: 42 }]);
});

/** 128以上は7ビットずつに分かれ、続きがあるバイトに最上位ビットが立つ */
test("128以上の数は続きのバイトを読んで組み立てる", () => {
  const fields = readFields(new Uint8Array([tag(1, 0), 0xac, 0x02]));

  assert.deepEqual(fields, [{ number: 1, value: 300 }]);
});

test("種別2の欄は長さのぶんだけ切り出す", () => {
  const text = bytesOf("ねずみの初恋");
  const fields = readFields(
    new Uint8Array([tag(2, 2), text.length, ...text, tag(3, 0), 7]),
  );

  assert.equal(stringOf(fields, 2), "ねずみの初恋");
  assert.equal(fields[1].value, 7);
});

/** 使わない種別を読み飛ばせないと、そこから先の欄が全部ずれる */
test("使わない種別は決まった長さだけ読み飛ばす", () => {
  const text = bytesOf("後ろの欄");
  const fields = readFields(
    new Uint8Array([
      tag(1, 5),
      1,
      2,
      3,
      4,
      tag(2, 1),
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      tag(3, 2),
      text.length,
      ...text,
    ]),
  );

  assert.equal(stringOf(fields, 3), "後ろの欄");
});

test("同じ番号の欄が並んでも全部返す", () => {
  const first = bytesOf("1つ目");
  const second = bytesOf("2つ目");
  const fields = readFields(
    new Uint8Array([
      tag(4, 2),
      first.length,
      ...first,
      tag(4, 2),
      second.length,
      ...second,
    ]),
  );

  assert.equal(fields.filter((field) => field.number === 4).length, 2);
  // 見つけるのは最初の1つ
  assert.equal(stringOf(fields, 4), "1つ目");
});

test("入れ子の欄はバイト列のまま返し、もう一度読める", () => {
  const inner = [tag(1, 0), 9];
  const fields = readFields(
    new Uint8Array([tag(5, 2), inner.length, ...inner]),
  );
  const nested = readFields(fields[0].value as Uint8Array);

  assert.deepEqual(nested, [{ number: 1, value: 9 }]);
});

test("無い番号を引くと空文字になる", () => {
  assert.equal(stringOf([], 1), "");
  assert.equal(stringOf([{ number: 1, value: 5 }], 1), "");
});
