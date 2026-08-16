import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import todayKey from "../date.ts";
import fetchHtml from "../fetchHtml.ts";

/**
 * 月マガ基地のトップは、更新日ごとの区画が新しい順に並ぶ。
 * 見出しは月と日が別々の要素に入る。区画には目印が無いので、
 * 日付の見出しを1つだけ含む一番外側の祖先を、その日の区画とみなす。
 * 作品の実体は comic-days.com にあり、同じ話へのリンクが何度も出る。
 */
const topUrl = "https://getsumagakichi.com/";
const episodePattern = /^https:\/\/comic-days\.com\/episode\//;
const maxClimb = 8;

export default async function getsumagakichi(): Promise<ParsedWork[]> {
  const $ = cheerio.load(await fetchHtml(topUrl));
  const [, month, day] = todayKey().split("-");
  const heading = $("[class*='UpdateDate_month']")
    .filter((_, el) => {
      const node = $(el);

      return (
        node.text().trim() === String(Number(month)) &&
        node.next("[class*='UpdateDate_day']").text().trim() ===
          String(Number(day))
      );
    })
    .first();

  if (heading.length === 0) {
    return [];
  }

  let section = heading;
  let ancestor = heading.parent();

  for (let climb = 0; climb < maxClimb && ancestor.length > 0; climb += 1) {
    if (ancestor.find("[class*='UpdateDate_month']").length > 1) {
      break;
    }

    section = ancestor;
    ancestor = ancestor.parent();
  }

  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  section.find("a[href]").each((_, el) => {
    const item = $(el);
    const href = item.attr("href") ?? "";

    if (!episodePattern.test(href)) {
      return;
    }

    const url = href.split("?")[0] ?? href;
    const image = item.find("img[alt]").first();
    const title = image.attr("alt")?.trim() ?? "";

    if (title === "" || seen.has(url)) {
      return;
    }

    seen.add(url);

    works.push({
      thumbnailUrl: image.attr("src") ?? null,
      title,
      url,
    });
  });

  return works;
}
