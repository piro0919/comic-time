import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import todayKey from "../date.ts";
import fetchHtml from "../fetchHtml.ts";

/**
 * SHURO は不定期更新で、トップの作品カードに最終更新日が入る。
 * その日付が今日のものだけを取る。
 */
const topUrl = "https://shuro.world/";

export default async function shuro(): Promise<ParsedWork[]> {
  const $ = cheerio.load(await fetchHtml(topUrl));
  const [year, month, day] = todayKey().split("-");
  const wanted = `${Number(year)}年${Number(month)}月${Number(day)}日`;
  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  $("a[data-manga-id]").each((_, el) => {
    const item = $(el);
    const shown = item
      .find("p")
      .filter((_, node) => $(node).text().includes("年"))
      .first()
      .text()
      .replace(/\s+/g, "");

    if (shown !== wanted) {
      return;
    }

    const title = item.find("h2").first().text().trim();
    const href = item.attr("href");

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
