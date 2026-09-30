import { readFields, stringOf } from "../protobuf";
import { type Episode } from "./episode";

/**
 * マンガワンの話の一覧。Web 版の読む画面が使っている API を叩く。POST でないと 405 が返る。
 *
 * Viewer { 11: ChapterList }
 * ChapterList { 1: repeated Chapter, 4: 全話数 }  新しい順
 * Chapter { 1: id, 2: 話数, 3: 副題, 5: 公開日「2026/09/24」, 12: 読み方 }
 *
 * 欄12 が 1 の回だけが、何も使わずに読める。2 は公開日が先の先読みで、
 * 印の無い回はライフやポイントを使って読む回になる。
 */
const origin = "https://manga-one.com";
/** 1回で頼む数。長い連載でも400話台なので、たいてい1回で済む */
const pageSize = 500;

/** 台帳の住所は作品ページ（/title/659）か読む画面（/manga/659/chapter/…）のどちらか */
function titleIdOf(url: string): string {
  const matched = /\/(?:title|manga)\/(\d+)/.exec(url);

  if (matched?.[1] === undefined) {
    throw new Error(`マンガワン: 作品の番号が読めない ${url}`);
  }

  return matched[1];
}

function listUrl(titleId: string, page: number): string {
  const params = new URLSearchParams({
    event_point: "0",
    free_point: "0",
    limit: String(pageSize),
    list_type: "chapter",
    page: String(page),
    paid_point: "0",
    rq: "viewer_v2",
    sort_type: "desc",
    title_id: titleId,
  });

  return `${origin}/api/client?${params.toString()}`;
}

function toEpisode(titleId: string, bytes: Uint8Array): Episode | null {
  const fields = readFields(bytes);
  const id = fields.find((field) => field.number === 1)?.value;

  if (typeof id !== "number") {
    return null;
  }

  const date = stringOf(fields, 5).replaceAll("/", "-");
  const mode = fields.find((field) => field.number === 12)?.value;

  return {
    access: mode === 1 ? "free" : mode === 2 ? "early" : "paid",
    date: date === "" ? null : date,
    title: [stringOf(fields, 2), stringOf(fields, 3)]
      .filter((part) => part !== "")
      .join(" "),
    url: `${origin}/manga/${titleId}/chapter/${id}`,
  };
}

export default async function mangaOne(url: string): Promise<Episode[]> {
  const titleId = titleIdOf(url);
  const episodes: Episode[] = [];

  for (let page = 1; ; page += 1) {
    const res = await fetch(listUrl(titleId, page), {
      method: "POST",
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      throw new Error(`マンガワン: ${res.status} ${res.statusText}`);
    }

    const list = readFields(new Uint8Array(await res.arrayBuffer())).find(
      (field) => field.number === 11 && field.value instanceof Uint8Array,
    );

    if (list === undefined) {
      throw new Error("マンガワン: 話の一覧が見つからない");
    }

    const fields = readFields(list.value as Uint8Array);
    const total = fields.find((field) => field.number === 4)?.value;
    const found = fields.flatMap((field) => {
      const episode =
        field.number === 1 && field.value instanceof Uint8Array
          ? toEpisode(titleId, field.value)
          : null;

      return episode === null ? [] : [episode];
    });

    episodes.push(...found);

    if (
      found.length < pageSize ||
      typeof total !== "number" ||
      episodes.length >= total
    ) {
      return episodes;
    }
  }
}
