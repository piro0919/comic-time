import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import todayKey from "../date.ts";
import fetchHtml from "../fetchHtml.ts";

/**
 * くらげバンチは火曜と金曜の更新で、トップに直近2回ぶんの区画が並ぶ。
 * 見出しが「8月14日金曜日の更新作品」なので、今日の日付のものだけを取る。
 * 区画の末尾に姉妹サイトへの誘導が混じるので、外のリンクは外す。
 */
const topUrl = "https://kuragebunch.com/";

export default async function kurageBunch(): Promise<ParsedWork[]> {
  const $ = cheerio.load(await fetchHtml(topUrl));
  const [, month, day] = todayKey().split("-");
  const wanted = `${Number(month)}月${Number(day)}日`;
  const section = $("#latest-update, #last-update")
    .filter((_, el) =>
      $(el)
        .find(".latest-update-title")
        .first()
        .text()
        .replace(/\s+/g, "")
        .includes(wanted),
    )
    .first();

  if (section.length === 0) {
    return [];
  }

  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  section.find(".series-items-box").each((_, el) => {
    const item = $(el);
    const title = item.find("h4").first().text().trim();
    const href = item.find("a[href]").first().attr("href");

    if (title === "" || href === undefined || seen.has(title)) {
      return;
    }

    const url = new URL(href, topUrl);

    // 「コミックバンチKaiはこちら」のような他サイトへの誘導は作品ではない
    if (url.host !== new URL(topUrl).host) {
      return;
    }

    seen.add(title);

    const image = item.find("img").first();
    const thumbnail = image.attr("data-src") ?? image.attr("src");

    works.push({
      thumbnailUrl: thumbnail ?? null,
      title,
      url: url.toString(),
    });
  });

  return works;
}
