import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import todayKey from "../date.ts";
import fetchHtml from "../fetchHtml.ts";
import resolveEpisodes from "../resolveEpisodes.ts";

/**
 * コミックブーストのトップには「最新更新」の一覧があり、
 * 札に「9/8更新」の形で日付が付く。年は書かれていないので、
 * 月日だけを今日と突き合わせる。
 *
 * 一覧に話への道は無いが、作品ページに「最新話を読む」の道が出ている。
 */
const topUrl = "https://comic-boost.com/";

/** 作品ページの「最新話を読む」。読み取れなければ null にして、その作品だけ作品ページに戻す */
async function latestEpisode(workUrl: string): Promise<null | string> {
  try {
    const $ = cheerio.load(await fetchHtml(workUrl));
    const href = $("a.btn-read")
      .filter((_, el) => $(el).text().includes("最新話"))
      .first()
      .attr("href");

    return href === undefined ? null : new URL(href, topUrl).toString();
  } catch {
    return null;
  }
}

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

  // 話への道は作品ページにしか無いので、1作品につき1枚見に行く
  return resolveEpisodes(works, latestEpisode);
}
