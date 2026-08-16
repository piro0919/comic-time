import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import todayKey from "../date.ts";
import fetchHtml from "../fetchHtml.ts";

/**
 * マガポケはトップページに「08/17 月曜日の更新作品」の枠がある。
 * 見出しの日付が今日と違えば、枠の作りが変わったとみなして取りやめる。
 */
const topUrl = "https://pocket.shonenmagazine.com/";

export default async function magazinePocket(): Promise<ParsedWork[]> {
  const $ = cheerio.load(await fetchHtml(topUrl));
  const section = $("#todayUpdated");
  const shown = section.find(".p-index-update__date").first().text().trim();
  const [, month, day] = todayKey().split("-");

  if (shown !== `${month}/${day}`) {
    throw new Error(`見出しの日付が今日ではない: ${shown}`);
  }

  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  section.find(".p-index-update__item").each((_, el) => {
    const item = $(el);
    const title = item.find(".c-comic-item__ttl").first().text().trim();
    const href = item.find("a[href]").first().attr("href");

    if (title === "" || href === undefined || seen.has(title)) {
      return;
    }

    seen.add(title);

    const thumbnail = item.find("img").first().attr("src");

    works.push({
      thumbnailUrl: thumbnail ?? null,
      title,
      url: new URL(href, topUrl).toString(),
    });
  });

  return works;
}
