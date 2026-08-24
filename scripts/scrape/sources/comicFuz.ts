import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import fetchHtml from "../fetchHtml.ts";
import { readFields, stringOf } from "../protobuf.ts";

/**
 * COMIC FUZ は protobuf でやり取りする API を使う。
 * トップページの応答の先頭の節が、そのまま画面の「今日の更新作品」にあたる。
 *
 * WebHomeResponse { 3: repeated Section }
 * Section { 1: MangaList }        // 先頭の節が今日の更新
 * MangaList { 1: repeated Manga }
 * Manga { 1: id, 2: title, 4: thumbnailPath, 15: "2026/08/17" }
 *
 * 応答に話は入っていないので、最新話の番号だけは作品ページから拾う。
 * 作品ページの __NEXT_DATA__ には話が巻ごとに束ねて入り、先頭の束の先頭が最新話。
 */
const apiUrl = "https://api.comic-fuz.com/v1/web_home_2";
const viewerOrigin = "https://comic-fuz.com/manga/viewer";
/** サムネイルはパスだけが返るので、配信元を足す */
const imageOrigin = "https://img.comic-fuz.com";

type MangaPage = {
  props: {
    pageProps: { chapters?: { chapters?: { chapterId?: number }[] }[] };
  };
};

/** 作品ページの最新話。読み取れなければ null にして、その作品だけ作品ページに戻す */
async function latestChapterId(url: string): Promise<null | number> {
  try {
    const embedded = cheerio
      .load(await fetchHtml(url))("#__NEXT_DATA__")
      .first()
      .text();

    if (embedded === "") {
      return null;
    }

    const { chapters } = (JSON.parse(embedded) as MangaPage).props.pageProps;

    return chapters?.[0]?.chapters?.[0]?.chapterId ?? null;
  } catch {
    return null;
  }
}

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

  const works = readFields(list.value as Uint8Array)
    .filter((field) => field.value instanceof Uint8Array)
    .map((field) => toWork(field.value as Uint8Array))
    .filter((work) => work !== null);

  // 話の番号は作品ページにしか無いので、1作品につき1枚見に行く
  return Promise.all(
    works.map(async (work) => {
      const chapterId = await latestChapterId(work.url);

      return chapterId === null
        ? work
        : { ...work, url: `${viewerOrigin}/${chapterId}` };
    }),
  );
}
