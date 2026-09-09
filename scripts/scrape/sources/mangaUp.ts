import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import fetchHtml from "../fetchHtml.ts";

/**
 * マンガUP!のトップには「今日の更新（水曜日）」の区画がある。
 * サイトが今日と言っているものをそのまま採る。こちらで日付を判断しない。
 *
 * 区画に並ぶのは作品への道だけで、話への道は無い。作品ページ止まりにする。
 * 見出しの並びの隣に「もっと見る」があるので、作品の住所の形で選り分ける。
 */
const topUrl = "https://www.manga-up.com/";
const headingText = "今日の更新";

export default async function mangaUp(): Promise<ParsedWork[]> {
  const $ = cheerio.load(await fetchHtml(topUrl));
  const heading = $("h2")
    .filter((_, el) => $(el).text().includes(headingText))
    .first();

  if (heading.length === 0) {
    throw new Error("マンガUP!: 今日の更新の区画が見つからない");
  }

  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  heading
    .closest("section")
    .find('a[href*="/titles/"]')
    .each((_, el) => {
      const link = $(el);
      const href = link.attr("href");
      const image = link.find("img").first();
      const title = image.attr("alt")?.trim() ?? "";

      if (href === undefined || title === "" || seen.has(title)) {
        return;
      }

      seen.add(title);

      const thumbnail = image.attr("src");

      works.push({
        thumbnailUrl:
          thumbnail === undefined ? null : new URL(thumbnail, topUrl).toString(),
        title,
        url: new URL(href, topUrl).toString(),
      });
    });

  return works;
}
