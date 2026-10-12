/** 必要な範囲だけの protobuf 読み取り。可変長整数と長さ付きバイト列だけ扱う */
export type Field = { number: number; value: number | Uint8Array };

/** タグ・長さ・IDしか読まないので、数値の範囲で足りる */
function readVarint(bytes: Uint8Array, start: number): [number, number] {
  let result = 0;
  let shift = 1;
  let index = start;

  while (index < bytes.length) {
    const byte = bytes[index];

    index += 1;
    result += (byte & 0x7f) * shift;

    if ((byte & 0x80) === 0) {
      break;
    }

    shift *= 128;
  }

  return [result, index];
}

/** 必要な範囲だけの protobuf 読み取り。可変長整数と長さ付きバイト列だけ扱う */
export function readFields(bytes: Uint8Array): Field[] {
  const fields: Field[] = [];

  let index = 0;

  while (index < bytes.length) {
    const [tag, afterTag] = readVarint(bytes, index);
    const number = Math.floor(tag / 8);
    const wireType = tag % 8;

    index = afterTag;

    if (wireType === 0) {
      const [value, next] = readVarint(bytes, index);

      fields.push({ number, value });
      index = next;
    } else if (wireType === 2) {
      const [length, next] = readVarint(bytes, index);
      const end = next + length;

      fields.push({ number, value: bytes.subarray(next, end) });
      index = end;
    } else if (wireType === 5) {
      index += 4;
    } else if (wireType === 1) {
      index += 8;
    } else {
      break;
    }
  }

  return fields;
}

export function stringOf(fields: Field[], number: number): string {
  const found = fields.find(
    (field) => field.number === number && field.value instanceof Uint8Array,
  );

  return found === undefined
    ? ""
    : new TextDecoder().decode(found.value as Uint8Array);
}
