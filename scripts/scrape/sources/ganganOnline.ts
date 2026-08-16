import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import fetchHtml from "../fetchHtml.ts";

/**
 * ガンガンONLINEのトップには「今日の更新作品」の節がある。
 * クラス名にビルドごとのハッシュが付くので、前方一致で拾う。
 */
const topUrl = "https://www.ganganonline.com/";
const heading = "今日の更新作品";

export default async function ganganOnline(): Promise<ParsedWork[]> {
  const $ = cheerio.load(await fetchHtml(topUrl));
  const section = $("[class*='GridSectionTemplate_contents']")
    .filter((_, el) =>
      $(el)
        .find("[class*='SectionHeader_container__header']")
        .first()
        .text()
        .includes(heading),
    )
    .first();

  if (section.length === 0) {
    throw new Error(`「${heading}」の節が見つからない`);
  }

  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  section.find("[class*='TitleCard_container']").each((_, el) => {
    const item = $(el);
    const title = item.find("[class*='TitleCard_name']").first().text().trim();
    const href = item.find("a[href]").first().attr("href");

    if (title === "" || href === undefined || seen.has(title)) {
      return;
    }

    seen.add(title);

    const thumbnail = item.find("img").first().attr("src");

    works.push({
      thumbnailUrl:
        thumbnail === undefined ? null : new URL(thumbnail, topUrl).toString(),
      title,
      url: new URL(href, topUrl).toString(),
    });
  });

  return works;
}
