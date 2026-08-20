import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import todayKey from "../date.ts";
import fetchHtml from "../fetchHtml.ts";

/**
 * 少年ジャンプ＋のトップには、日付ごとの更新作品が7日ぶん並ぶ。
 * 見出しに「8月17日」と入るので、今日の節だけを取る。
 */
const topUrl = "https://shonenjumpplus.com/";

export default async function shonenJumpPlus(): Promise<ParsedWork[]> {
  const $ = cheerio.load(await fetchHtml(topUrl));
  const [, month, day] = todayKey().split("-");
  const wanted = `${Number(month)}月${Number(day)}日`;
  const section = $("section.daily")
    .filter((_, el) =>
      $(el).find(".date").first().text().replace(/\s+/g, "").includes(wanted),
    )
    .first();

  if (section.length === 0) {
    throw new Error(`今日の節が見つからない: ${wanted}`);
  }

  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  section.find(".daily-series-item").each((_, el) => {
    const item = $(el);
    const title = item.find(".daily-series-title").first().text().trim();
    const href = item.find("a[href]").first().attr("href");

    if (title === "" || href === undefined || seen.has(title)) {
      return;
    }

    seen.add(title);

    const thumbnail = item
      .find(".daily-series-thumb-square")
      .first()
      .attr("src");

    works.push({
      thumbnailUrl: thumbnail ?? null,
      title,
      url: new URL(href, topUrl).toString(),
    });
  });

  return works;
}
