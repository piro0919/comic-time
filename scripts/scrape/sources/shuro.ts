import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import todayKey from "../date.ts";
import fetchHtml from "../fetchHtml.ts";

/**
 * SHURO は不定期更新で、トップの作品カードに最終更新日が入る。
 * その日付が今日のものだけを取る。
 *
 * 同じページに const mangaData = [...] が埋まっていて、作品ごとの各話の住所まで
 * 入っている。並びは作品ページの見え方と同じで、先頭が最新話にあたる。
 * 読み切りの試し読みだけは古い順に並ぶが、更新一覧には出てこない。
 */
const topUrl = "https://shuro.world/";
const dataPattern = /const mangaData\s*=\s*(\[[\s\S]*?\])\s*;?\s*<\/script>/;

type MangaData = {
  episodes?: { permalink?: string }[];
  id?: number;
}[];

/** 作品の番号から最新話の住所を引く表。読み取れなければ空にする */
function latestEpisodes(html: string): Map<string, string> {
  const found = dataPattern.exec(html);
  const table = new Map<string, string>();

  if (found?.[1] === undefined) {
    return table;
  }

  try {
    (JSON.parse(found[1]) as MangaData).forEach((manga) => {
      const permalink = manga.episodes?.[0]?.permalink;

      if (manga.id !== undefined && permalink !== undefined) {
        table.set(String(manga.id), permalink);
      }
    });
  } catch {
    return new Map();
  }

  return table;
}

export default async function shuro(date = todayKey()): Promise<ParsedWork[]> {
  const html = await fetchHtml(topUrl);
  const $ = cheerio.load(html);
  const episodes = latestEpisodes(html);
  const [year, month, day] = date.split("-");
  const wanted = `${Number(year)}年${Number(month)}月${Number(day)}日`;
  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  $("a[data-manga-id]").each((_, el) => {
    const item = $(el);
    const shown = item
      .find("p")
      .filter((_, node) => $(node).text().includes("年"))
      .first()
      .text()
      .replace(/\s+/g, "");

    if (shown !== wanted) {
      return;
    }

    const title = item.find("h2").first().text().trim();
    const href = item.attr("href");

    if (title === "" || href === undefined || seen.has(title)) {
      return;
    }

    seen.add(title);

    const image = item.find("img").first();
    const thumbnail = image.attr("data-src") ?? image.attr("src");
    const episode = episodes.get(item.attr("data-manga-id") ?? "");

    works.push({
      thumbnailUrl: thumbnail ?? null,
      title,
      url: new URL(episode ?? href, topUrl).toString(),
    });
  });

  return works;
}
