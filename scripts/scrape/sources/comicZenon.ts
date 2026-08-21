import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import todayKey from "../date.ts";
import fetchHtml from "../fetchHtml.ts";

/**
 * ゼノンプラスのトップは、配信日ごとに区画が分かれている。
 * 更新は12時なので、それより前に走ったときは今日の区画がまだ無い。
 * 区画には編集部のお知らせも混じるので、それは外す。
 */
const topUrl = "https://comic-zenon.com/";

export default async function comicZenon(
  date = todayKey(),
): Promise<ParsedWork[]> {
  const $ = cheerio.load(await fetchHtml(topUrl));
  const [year, month, day] = date.split("-");
  const wanted = `${year}年${month}月${day}日`;
  const area = $(".panel-area")
    .filter((_, el) =>
      $(el)
        .find(".distribution-date")
        .first()
        .text()
        .replace(/\s+/g, "")
        .includes(wanted),
    )
    .first();

  if (area.length === 0) {
    return [];
  }

  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  area.find("a[data-series-title]").each((_, el) => {
    const item = $(el);
    const title = item.attr("data-series-title")?.trim() ?? "";
    const href = item.attr("href");

    // 「更新スケジュール」などのお知らせは作品ではないので外す
    if (item.closest(".badge_info").length > 0) {
      return;
    }

    if (title === "" || href === undefined || seen.has(title)) {
      return;
    }

    seen.add(title);

    const image = item.find("img").first();
    const thumbnail = image.attr("data-src") ?? image.attr("src");

    works.push({
      thumbnailUrl: thumbnail ?? null,
      title,
      url: new URL(href, topUrl).toString(),
    });
  });

  return works;
}
