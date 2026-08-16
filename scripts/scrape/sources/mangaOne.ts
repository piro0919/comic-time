import { type ParsedWork } from "../../../src/types/work.ts";
import todayKey from "../date.ts";
import { readFields, stringOf } from "../protobuf.ts";

/**
 * マンガワンは protobuf を返す API を持ち、日付ごとの更新一覧が7日ぶん入る。
 *
 * Home { 2: Section }
 * Section { 1: repeated DayGroup }
 * DayGroup { 1: 月, 2: 日, 3: 曜日番号, 4: repeated Slot }
 * Slot { 1: Manga }
 * Manga { 1: id, 2: title, 4: あらすじ, 7: サムネイル, 12: 今日更新の印 }
 *
 * 曜日の枠には更新の無い作品も並ぶので、印の付いたものだけを取る。
 */
const apiUrl =
  "https://manga-one.com/api/client?rq=home&is_from_redirect=false";
const workOrigin = "https://manga-one.com/title";

export default async function mangaOne(): Promise<ParsedWork[]> {
  const res = await fetch(apiUrl, { signal: AbortSignal.timeout(30000) });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  const section = readFields(new Uint8Array(await res.arrayBuffer())).find(
    (field) => field.number === 2 && field.value instanceof Uint8Array,
  );

  if (section === undefined) {
    throw new Error("更新一覧の節が見つからない");
  }

  const [, month, day] = todayKey().split("-");
  const group = readFields(section.value as Uint8Array)
    .filter((field) => field.number === 1 && field.value instanceof Uint8Array)
    .find((field) => {
      const fields = readFields(field.value as Uint8Array);

      return (
        fields.find((entry) => entry.number === 1)?.value === Number(month) &&
        fields.find((entry) => entry.number === 2)?.value === Number(day)
      );
    });

  if (group === undefined) {
    return [];
  }

  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  readFields(group.value as Uint8Array)
    .filter((field) => field.number === 4 && field.value instanceof Uint8Array)
    .forEach((slot) => {
      const card = readFields(slot.value as Uint8Array).find(
        (field) => field.number === 1 && field.value instanceof Uint8Array,
      );

      if (card === undefined) {
        return;
      }

      const fields = readFields(card.value as Uint8Array);
      const id = fields.find((field) => field.number === 1)?.value;
      const title = stringOf(fields, 2);
      const updated = fields.some((field) => field.number === 12);

      if (
        !updated ||
        typeof id !== "number" ||
        title === "" ||
        seen.has(title)
      ) {
        return;
      }

      seen.add(title);

      const thumbnail = stringOf(fields, 7);

      works.push({
        thumbnailUrl: thumbnail === "" ? null : thumbnail,
        title,
        url: `${workOrigin}/${id}`,
      });
    });

  return works;
}
