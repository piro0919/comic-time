import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import todayKey from "../date.ts";
import fetchHtml from "../fetchHtml.ts";

/**
 * コミックDAYSのトップにある「オリジナル」は、曜日ごとの区画に分かれ、
 * 見出しのタブが「日 8/16」のように曜日と日付を持つ。
 * タブから曜日と日付の対応を作り、今日にあたる区画だけを取る。
 */
const topUrl = "https://comic-days.com/";
const weekdayIds = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
const weekdayJa = ["日", "月", "火", "水", "木", "金", "土"];

export default async function comicDays(): Promise<ParsedWork[]> {
  const $ = cheerio.load(await fetchHtml(topUrl));
  const [, month, day] = todayKey().split("-");
  const wanted = `${Number(month)}/${Number(day)}`;

  let id: null | string = null;

  $("#days-original [role='button']").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, "");
    const index = weekdayJa.indexOf(text.slice(0, 1));

    if (index < 0 || !text.includes(wanted)) {
      return;
    }

    id ??= weekdayIds.at(index) ?? null;
  });

  if (id === null) {
    return [];
  }

  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  $(`#days-original-${id} a[data-series-name]`).each((_, el) => {
    const item = $(el);
    const title = item.attr("data-series-name")?.trim() ?? "";
    const href = item.attr("href");

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
