import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import fetchHtml from "../fetchHtml.ts";

/**
 * ヤンマガWebのトップには今日の更新が「マンガ」「記事」の区画に分かれて並ぶ。
 * 記事はニュースなので、マンガの区画だけを取る。
 */
const topUrl = "https://yanmaga.jp/";
const wantedKind = "マンガ";

export default async function yanmaga(): Promise<ParsedWork[]> {
  const $ = cheerio.load(await fetchHtml(topUrl));
  const block = $(".top-today-update-block")
    .filter(
      (_, el) =>
        $(el).find(".top-today-update-kind-title").first().text().trim() ===
        wantedKind,
    )
    .first();

  if (block.length === 0) {
    throw new Error(`「${wantedKind}」の区画が見つからない`);
  }

  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  block.find(".mod-book-item").each((_, el) => {
    const item = $(el);
    const title = item.find(".mod-book-title").first().text().trim();
    const href = item.find("a[href]").first().attr("href");

    if (title === "" || href === undefined || seen.has(title)) {
      return;
    }

    seen.add(title);

    const image = item.find("img").first();
    const thumbnail = image.attr("data-src") ?? image.attr("src");

    works.push({
      thumbnailUrl:
        thumbnail === undefined || thumbnail === ""
          ? null
          : new URL(thumbnail, topUrl).toString(),
      title,
      url: new URL(href, topUrl).toString(),
    });
  });

  return works;
}
