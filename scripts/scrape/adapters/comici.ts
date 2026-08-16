import * as cheerio from "cheerio";
import {
  type DailyWorks,
  type ParsedWork,
  type SiteEntry,
} from "../../../src/types/work.ts";
import { todayKey } from "../dates.ts";
import fetchHtml from "../fetchHtml.ts";

/**
 * comici 基盤のサイト。曜日別の一覧が更新順に並び、
 * その日更新されたものには「更新」の印が付く。
 */
const maxPages = 10;

function dayNumber(): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    weekday: "short",
  })
    .format(new Date())
    .toLowerCase();

  // 月曜=1、日曜=7
  return ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].indexOf(weekday) + 1;
}

export default async function comici(site: SiteEntry): Promise<DailyWorks> {
  const origin = new URL(site.daily?.url ?? site.url).origin;
  const day = dayNumber();
  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= maxPages; page += 1) {
    const $ = cheerio.load(
      await fetchHtml(`${origin}/category/manga/day/${day}/${page}`),
    );
    const items = $(".series-list-item");

    if (items.length === 0) {
      break;
    }

    let updatedOnPage = 0;

    items.each((_, el) => {
      const item = $(el);

      if (item.find(".g-updated-mark").length === 0) {
        return;
      }

      updatedOnPage += 1;

      const href = item.find("a[href]").first().attr("href");
      const title = item.find("[data-e2e='sliTitle']").first().text().trim();

      if (href === undefined || title === "" || seen.has(title)) {
        return;
      }

      seen.add(title);

      const author = item
        .find(".series-list-item-author")
        .first()
        .text()
        .trim();
      const thumbnail = item.find("img").first().attr("src");

      works.push({
        author: author === "" ? null : author,
        thumbnailUrl: thumbnail ?? null,
        title,
        url: new URL(href, origin).toString(),
      });
    });

    // 更新順に並ぶので、印の付いた作品が尽きたページから先は見ない
    if (updatedOnPage === 0) {
      break;
    }
  }

  return works.length === 0 ? {} : { [todayKey()]: works };
}
