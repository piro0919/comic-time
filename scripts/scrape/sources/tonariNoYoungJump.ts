import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import todayKey from "../date.ts";
import fetchHtml from "../fetchHtml.ts";

/**
 * となりのヤングジャンプのトップは、更新日の見出しが区画の先頭の項目に入り、
 * 次の見出しが出るまで同じ日の作品が続く。
 * 更新は12時なので、それより前に走ったときは今日の見出しがまだ無い。
 */
const topUrl = "https://tonarinoyj.jp/";

export default async function tonariNoYoungJump(): Promise<ParsedWork[]> {
  const $ = cheerio.load(await fetchHtml(topUrl));
  const [, month, day] = todayKey().split("-");
  const wanted = `${month}.${day}`;
  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  let current: null | string = null;

  $(".update-series-item").each((_, el) => {
    const item = $(el);
    const heading = item.find(".update-day-container").first();

    if (heading.length > 0) {
      current = heading.text().replace(/\s+/g, "");
    }

    if (current === null || !current.includes(wanted)) {
      return;
    }

    const title = item
      .find(".update-series-title")
      .filter((_, node) => $(node).text().trim() !== "")
      .first()
      .text()
      .trim();
    const href = item.find("a[href]").first().attr("href");

    if (title === "" || href === undefined || seen.has(title)) {
      return;
    }

    const url = new URL(href, topUrl);

    if (url.host !== new URL(topUrl).host) {
      return;
    }

    seen.add(title);

    const image = item.find("img").first();
    const thumbnail = image.attr("data-src") ?? image.attr("src");

    works.push({
      thumbnailUrl: thumbnail ?? null,
      title,
      url: url.toString(),
    });
  });

  return works;
}
