import * as cheerio from "cheerio";
import {
  type DailyWorks,
  type ParsedWork,
  type SiteEntry,
} from "../../../src/types/work.ts";
import { dateKeyOf, recentKeys } from "../dates.ts";
import fetchHtml from "../fetchHtml.ts";

/**
 * GigaViewer 系のサイトは共通の Atom フィードを持ち、
 * 更新された話が日時つきで並ぶ。作品名は content に入る。
 */
export default async function gigaviewer(site: SiteEntry): Promise<DailyWorks> {
  const feedUrl = site.daily?.url ?? new URL("/atom", site.url).toString();
  const $ = cheerio.load(await fetchHtml(feedUrl), { xmlMode: true });
  const wanted = new Set(recentKeys());
  const result: DailyWorks = {};

  $("entry").each((_, el) => {
    const entry = $(el);
    const updated = entry.find("updated").first().text();
    const url = entry.find("link[href]").first().attr("href");
    const title = entry.find("content").first().text().trim();

    if (updated === "" || url === undefined || title === "") {
      return;
    }

    const date = dateKeyOf(new Date(updated));

    if (!wanted.has(date)) {
      return;
    }

    const author = entry.find("author > name").first().text().trim();
    const thumbnail = entry.find("link[rel='enclosure']").first().attr("href");
    const work: ParsedWork = {
      author: author === "" ? null : author,
      thumbnailUrl: thumbnail ?? null,
      title,
      url,
    };
    const works = result[date] ?? [];

    // 同じ作品が1日に複数話更新されることがあるので、作品名で1つにまとめる
    if (works.some((existing) => existing.title === work.title)) {
      return;
    }

    result[date] = [...works, work];
  });

  return result;
}
