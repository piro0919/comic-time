import { type DailyWorks } from "../../../src/types/work.ts";
import { dateKeyOf, recentKeys } from "../dates.ts";
import { readFields, stringOf } from "../protobuf.ts";

/**
 * ゼロサムオンラインも protobuf を返す。
 * ホーム { 3: repeated 更新日グループ { 1: 日時, 2: repeated 作品 } }
 * 作品 { 2: スラッグ, 3: タイトル, 5: 作者, 8: サムネイル, 9: 更新日時 }
 */
const apiUrl = "https://api.zerosumonline.com/api/v1/home";
const workOrigin = "https://zerosumonline.com/detail";

export default async function zerosumOnline(): Promise<DailyWorks> {
  const res = await fetch(apiUrl, { signal: AbortSignal.timeout(30000) });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  const wanted = new Set(recentKeys());
  const result: DailyWorks = {};
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

      const date = dateKeyOf(new Date(updatedAt * 1000));

      // 同じ作品が複数回更新されていても、一覧には1回だけ出す
      if (!wanted.has(date) || seen.has(slug)) {
        return;
      }

      seen.add(slug);

      const author = stringOf(fields, 5);
      const thumbnail = stringOf(fields, 8);

      result[date] = [
        ...(result[date] ?? []),
        {
          author: author === "" ? null : author,
          thumbnailUrl: thumbnail === "" ? null : thumbnail,
          title,
          url: `${workOrigin}/${slug}`,
        },
      ];
    });

  return result;
}
