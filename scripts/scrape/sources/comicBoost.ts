import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import todayKey from "../date.ts";
import fetchHtml from "../fetchHtml.ts";

/**
 * コミックブーストのトップには「最新更新」の一覧があり、
 * 札に「9/8更新」の形で日付が付く。年は書かれていないので、
 * 月日だけを今日と突き合わせる。
 *
 * 一覧が指すのは作品ページで、話への道は無い。作品ページ止まりにする。
 */
const topUrl = "https://comic-boost.com/";

export default async function comicBoost(
  date = todayKey(),
): Promise<ParsedWork[]> {
  const $ = cheerio.load(await fetchHtml(topUrl));
  const [, month, day] = date.split("-");
  const wanted = `${Number(month)}/${Number(day)}更新`;
  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  $(".top-comic-list-item").each((_, el) => {
    const item = $(el);
    const badge = item.find(".badge.start-date").first().text().trim();

    if (badge !== wanted) {
      return;
    }

    const title = item.find(".title-name").first().text().trim();
    const href = item.attr("href");

    if (title === "" || href === undefined || seen.has(title)) {
      return;
    }

    seen.add(title);

    const image = item.find("img.thum").first();
    const thumbnail = image.attr("data-src") ?? image.attr("src");

    works.push({
      thumbnailUrl:
        thumbnail === undefined ? null : new URL(thumbnail, topUrl).toString(),
      title,
      url: new URL(href, topUrl).toString(),
    });
  });

  return works;
}
