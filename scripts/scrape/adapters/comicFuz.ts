import {
  type ParsedWork,
  type Weekday,
  weekdays,
} from "../../../src/types/work.ts";
import { readFields, stringOf } from "../protobuf.ts";

/**
 * COMIC FUZ は protobuf でやり取りする API を使う。
 * 必要なのは曜日別の作品一覧だけなので、その2つのメッセージだけ手で読み書きする。
 *
 * MangasByDayOfWeekRequest { 1: DeviceInfo, 2: dayOfWeek }
 * DeviceInfo { 3: deviceType }  // 2 = BROWSER
 * MangasByDayOfWeekResponse { 1: repeated Manga }
 * Manga { 1: id, 2: title, 4: repeated Author, 5: thumbnailUrl }
 * Author { 2: name }
 */
const apiUrl = "https://api.comic-fuz.com/v1/mangas_by_day_of_week";
/** サムネイルはパスだけが返るので、配信元を足す */
const imageOrigin = "https://img.comic-fuz.com";
const dayNumbers: Record<Weekday, number> = {
  fri: 5,
  mon: 1,
  sat: 6,
  sun: 7,
  thu: 4,
  tue: 2,
  wed: 3,
};

function toWork(manga: Uint8Array): null | ParsedWork {
  const fields = readFields(manga);
  const id = fields.find((field) => field.number === 1)?.value;
  const title = stringOf(fields, 2);

  if (typeof id !== "number" || title === "") {
    return null;
  }

  const authors = fields
    .filter((field) => field.number === 4 && field.value instanceof Uint8Array)
    .map((field) => stringOf(readFields(field.value as Uint8Array), 2))
    .filter((name) => name !== "");
  const thumbnail = stringOf(fields, 5);

  return {
    author: authors.length === 0 ? null : authors.join("/"),
    thumbnailUrl: thumbnail === "" ? null : `${imageOrigin}${thumbnail}`,
    title,
    url: `https://comic-fuz.com/manga/${id}`,
  };
}

export default async function comicFuz(): Promise<
  Record<Weekday, ParsedWork[]>
> {
  const result = Object.fromEntries(
    weekdays.map((weekday) => [weekday, []]),
  ) as Record<Weekday, ParsedWork[]>;

  for (const weekday of weekdays) {
    // DeviceInfo{deviceType: BROWSER} を包んだリクエスト
    const body = new Uint8Array([
      0x0a,
      0x02,
      0x18,
      0x02,
      0x10,
      dayNumbers[weekday],
    ]);
    const res = await fetch(apiUrl, {
      body,
      headers: { "Content-Type": "application/protobuf" },
      method: "POST",
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    const bytes = new Uint8Array(await res.arrayBuffer());

    result[weekday] = readFields(bytes)
      .filter(
        (field) => field.number === 1 && field.value instanceof Uint8Array,
      )
      .map((field) => toWork(field.value as Uint8Array))
      .filter((work) => work !== null);
  }

  return result;
}
