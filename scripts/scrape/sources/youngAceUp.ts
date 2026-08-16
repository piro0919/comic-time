import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import todayKey from "../date.ts";
import fetchHtml from "../fetchHtml.ts";

/**
 * ヤングエースUPのトップには、更新日ごとの区画が id="update_2026-08-14" の形で並ぶ。
 * 作品はカドコミで配信されるため、リンク先も comic-walker.com になる。
 */
const topUrl = "https://web-ace.jp/youngaceup/";

export default async function youngAceUp(
  date = todayKey(),
): Promise<ParsedWork[]> {
  const $ = cheerio.load(await fetchHtml(topUrl));
  const section = $(`[id="update_${date}"]`);

  if (section.length === 0) {
    return [];
  }

  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  section.find(".label-top-update__item").each((_, el) => {
    const item = $(el);
    const title = item.find(".item-ttl").first().text().trim();
    const href = item.find("a[href]").first().attr("href");

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
