import { type ParsedWork } from "../../../src/types/work.ts";
import { readFields, stringOf } from "../protobuf.ts";

/**
 * COMIC FUZ は protobuf でやり取りする API を使う。
 * トップページの応答の先頭の節が、そのまま画面の「今日の更新作品」にあたる。
 *
 * WebHomeResponse { 3: repeated Section }
 * Section { 1: MangaList }        // 先頭の節が今日の更新
 * MangaList { 1: repeated Manga }
 * Manga { 1: id, 2: title, 4: thumbnailPath, 15: "2026/08/17" }
 */
const apiUrl = "https://api.comic-fuz.com/v1/web_home_2";
/** サムネイルはパスだけが返るので、配信元を足す */
const imageOrigin = "https://img.comic-fuz.com";

function toWork(manga: Uint8Array): null | ParsedWork {
  const fields = readFields(manga);
  const id = fields.find((field) => field.number === 1)?.value;
  const title = stringOf(fields, 2);

  if (typeof id !== "number" || title === "") {
    return null;
  }

  const thumbnail = stringOf(fields, 4);

  return {
    thumbnailUrl: thumbnail === "" ? null : `${imageOrigin}${thumbnail}`,
    title,
    url: `https://comic-fuz.com/manga/${id}`,
  };
}

export default async function comicFuz(): Promise<ParsedWork[]> {
  // DeviceInfo{deviceType: BROWSER} だけを渡す
  const body = new Uint8Array([0x0a, 0x02, 0x18, 0x02]);
  const res = await fetch(apiUrl, {
    body,
    headers: { "Content-Type": "application/protobuf" },
    method: "POST",
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  const sections = readFields(new Uint8Array(await res.arrayBuffer())).filter(
    (field) => field.number === 3 && field.value instanceof Uint8Array,
  );
  const first = sections.at(0);

  if (first === undefined) {
    throw new Error("節が1つも返らなかった");
  }

  const list = readFields(first.value as Uint8Array).find(
    (field) => field.number === 1 && field.value instanceof Uint8Array,
  );

  if (list === undefined) {
    throw new Error("先頭の節に作品一覧が無かった");
  }

  return readFields(list.value as Uint8Array)
    .filter((field) => field.value instanceof Uint8Array)
    .map((field) => toWork(field.value as Uint8Array))
    .filter((work) => work !== null);
}
