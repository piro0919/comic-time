import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import todayKey from "../date.ts";
import fetchHtml from "../fetchHtml.ts";

/**
 * サンデーうぇぶりのトップには「今日の更新」と「昨日の更新」が同じ節に並ぶ。
 * 一覧は今日ぶんが先に来るので、最初の一覧だけを取る。
 * 見出しに 08.17 のような日付が入るので、今日かどうかも確かめる。
 */
const topUrl = "https://www.sunday-webry.com/";

export default async function sundayWebry(): Promise<ParsedWork[]> {
  const $ = cheerio.load(await fetchHtml(topUrl));
  const [, month, day] = todayKey().split("-");
  const section = $(".top-today").first();
  const shown = section.find(".date").first().text().replace(/\s+/g, "");

  if (!shown.startsWith(`${month}.${day}`)) {
    throw new Error(`見出しの日付が今日ではない: ${shown}`);
  }

  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  const list = section.find(".daily-series-list").first();

  list.find(".daily-series-item").each((_, el) => {
    const item = $(el);
    const title = item.find("h4").first().text().trim();
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
