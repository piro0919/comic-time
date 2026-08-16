import { type ParsedWork } from "../../../src/types/work.ts";
import todayKey from "../date.ts";
import { readFields, stringOf } from "../protobuf.ts";

/**
 * ゼロサムオンラインは protobuf を返す API を持つ。
 * ホーム { 3: repeated 更新日グループ { 1: 日時, 2: repeated 作品 } }
 * 作品 { 2: スラッグ, 3: タイトル, 5: 作者, 8: サムネイル, 9: 更新日時 }
 */
const apiUrl = "https://api.zerosumonline.com/api/v1/home";
const workOrigin = "https://zerosumonline.com/detail";

function dateOf(seconds: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Tokyo",
    year: "numeric",
  }).format(new Date(seconds * 1000));
}

export default async function zerosumOnline(
  date = todayKey(),
): Promise<ParsedWork[]> {
  const res = await fetch(apiUrl, { signal: AbortSignal.timeout(30000) });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  readFields(new Uint8Array(await res.arrayBuffer()))
    .filter((field) => field.number === 3 && field.value instanceof Uint8Array)
    .flatMap((group) =>
      readFields(group.value as Uint8Array).filter(
        (field) => field.number === 2 && field.value instanceof Uint8Array,
      ),
    )
    .forEach((entry) => {
      const fields = readFields(entry.value as Uint8Array);
      const slug = stringOf(fields, 2);
      const title = stringOf(fields, 3);
      const updatedAt = fields.find((field) => field.number === 9)?.value;

      if (slug === "" || title === "" || typeof updatedAt !== "number") {
        return;
      }

      // 同じ作品が複数回更新されていても、一覧には1回だけ出す
      if (dateOf(updatedAt) !== date || seen.has(slug)) {
        return;
      }

      seen.add(slug);

      const thumbnail = stringOf(fields, 8);

      works.push({
        thumbnailUrl: thumbnail === "" ? null : thumbnail,
        title,
        url: `${workOrigin}/${slug}`,
      });
    });

  return works;
}
