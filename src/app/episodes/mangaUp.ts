import { type Episode } from "./episode";
import fetchText from "./fetchText";
import { flightOf, sliceJson } from "./flight";

/**
 * マンガUP!の話の一覧。作品ページ（/titles/<id>）に埋め込まれた React の受け渡し
 * （self.__next_f.push の中身）に、全話が古い順で JSON の配列として入っている。
 *
 * 読み方は publishingStatus。3 はそのまま Web で読める無料の回、
 * 1 は「10月5日にチケットが使えます」の付く先読みの回、2 はアプリのチケットで読む回。
 * 公開日は載っていない。
 */
type Chapter = {
  id: number;
  name: string;
  publishingStatus?: number;
  subName?: string;
};

const origin = "https://www.manga-up.com";

/** 台帳の住所は作品ページ（/titles/1612）か話のページ（/titles/1612/chapters/…） */
function titleIdOf(url: string): string {
  const matched = /\/titles\/(\d+)/.exec(url);

  if (matched?.[1] === undefined) {
    throw new Error(`マンガUP!: 作品の番号が読めない ${url}`);
  }

  return matched[1];
}

function accessOf(status: number | undefined): Episode["access"] {
  switch (status) {
    case 1:
      return "early";
    case 2:
      return "paid";
    case 3:
      return "free";
    default:
      return null;
  }
}

export default async function mangaUp(url: string): Promise<Episode[]> {
  const titleId = titleIdOf(url);
  const flight = flightOf(await fetchText(`${origin}/titles/${titleId}`));
  const key = "\"chapters\":";
  const start = flight.indexOf(`${key}[`);

  if (start === -1) {
    throw new Error(`マンガUP!: 話の一覧が見つからない ${url}`);
  }

  const chapters = JSON.parse(
    sliceJson(flight, start + key.length),
  ) as Chapter[];

  return chapters.toReversed().map((chapter) => ({
    access: accessOf(chapter.publishingStatus),
    date: null,
    // 話数が subName に入っている作品では「第8話 副題」の形に並べ直す
    title: [chapter.subName ?? "", chapter.name]
      .filter((part) => part !== "")
      .join(" "),
    url: `${origin}/titles/${titleId}/chapters/${chapter.id}`,
  }));
}
