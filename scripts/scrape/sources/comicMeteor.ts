import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import todayKey from "../date.ts";
import fetchHtml from "../fetchHtml.ts";

/**
 * COMICメテオはきら星ポータルの中のレーベルで、
 * 掲載日ごとの見出しと作品の並びが交互に置かれている。
 * 見出しは月と日が別々の要素に入る。
 */
const topUrl = "https://kirapo.jp/meteor";

export default async function comicMeteor(): Promise<ParsedWork[]> {
  const $ = cheerio.load(await fetchHtml(topUrl));
  const [, month, day] = todayKey().split("-");
  const heading = $("#titles-container .d-flex")
    .filter((_, el) => {
      const parts = $(el)
        .find(".heading-text")
        .map((_, node) => $(node).text().trim())
        .get();

      return parts[0] === month && parts[1] === day;
    })
    .first();

  if (heading.length === 0) {
    return [];
  }

  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  heading
    .next(".grid-group")
    .find("a[href]")
    .each((_, el) => {
      const item = $(el);
      const href = item.attr("href");
      const image = item.find("img[alt]").first();
      const title = image.attr("alt")?.trim() ?? "";

      if (href === undefined || title === "" || seen.has(title)) {
        return;
      }

      seen.add(title);

      works.push({
        thumbnailUrl: image.attr("src") ?? null,
        title,
        url: new URL(href, topUrl).toString(),
      });
    });

  return works;
}
