import * as cheerio from "cheerio";
import { type Episode } from "./episode";
import fetchText from "./fetchText";

/**
 * COMIC FUZ の話の一覧。作品ページ（/manga/<id>）の __NEXT_DATA__ に全話が入っている。
 * 巻ごとの束で、束も束の中も新しい順。告知の回が1週ずれて前後することがあるが、
 * 画面と同じ並びのまま返す。
 *
 * 台帳の住所は作品ページか読む画面（/manga/viewer/<chapterId>）。
 * 読む画面なら、その __NEXT_DATA__ にある mangaId から作品ページへ行く。
 *
 * 必要なメダルの数（pointConsumption.amount）が 0 か無ければ無料。
 * badge の 2 は画面で「先読み」の札を出す印なので、それを先読みとする。
 */
type Chapter = {
  badge?: number;
  chapterId: number;
  chapterMainName: string;
  chapterSubName?: string;
  pointConsumption?: null | { amount?: number };
  updatedDate?: string;
};

type MangaPage = {
  props: { pageProps: { chapters?: { chapters?: Chapter[] }[] } };
};

type ViewerPage = {
  props: { pageProps: { data?: { mangaId?: number } } };
};

const origin = "https://comic-fuz.com";
/** 画面で「先読み」の札を出す印 */
const advanceBadge = 2;

function nextDataOf(html: string, url: string): unknown {
  const embedded = cheerio.load(html)("#__NEXT_DATA__").first().text();

  if (embedded === "") {
    throw new Error(`COMIC FUZ: ページの中身が読めない ${url}`);
  }

  return JSON.parse(embedded);
}

async function mangaIdOf(url: string): Promise<string> {
  const direct = /\/manga\/(\d+)/.exec(url)?.[1];

  if (direct !== undefined) {
    return direct;
  }

  if (!/\/manga\/viewer\/\d+/.test(url)) {
    throw new Error(`COMIC FUZ: 作品の番号が読めない ${url}`);
  }

  const page = nextDataOf(await fetchText(url), url) as ViewerPage;
  const mangaId = page.props.pageProps.data?.mangaId;

  if (mangaId === undefined) {
    throw new Error(`COMIC FUZ: 作品の番号が読めない ${url}`);
  }

  return String(mangaId);
}

function toEpisode(chapter: Chapter): Episode {
  const amount = chapter.pointConsumption?.amount ?? 0;
  const date = chapter.updatedDate?.replaceAll("/", "-") ?? "";

  return {
    access:
      amount === 0 ? "free" : chapter.badge === advanceBadge ? "early" : "paid",
    date: date === "" ? null : date,
    title: [chapter.chapterMainName, chapter.chapterSubName ?? ""]
      .filter((part) => part !== "")
      .join(" "),
    url: `${origin}/manga/viewer/${chapter.chapterId}`,
  };
}

export default async function comicFuz(url: string): Promise<Episode[]> {
  const workUrl = `${origin}/manga/${await mangaIdOf(url)}`;
  const page = nextDataOf(await fetchText(workUrl), workUrl) as MangaPage;
  const volumes = page.props.pageProps.chapters;

  if (volumes === undefined) {
    throw new Error(`COMIC FUZ: 話の一覧が見つからない ${workUrl}`);
  }

  return volumes.flatMap((volume) => volume.chapters ?? []).map(toEpisode);
}
