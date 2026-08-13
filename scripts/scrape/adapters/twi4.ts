import * as cheerio from "cheerio";
import {
  type ParsedWork,
  type Weekday,
  weekdayJa,
  weekdays,
} from "../../../src/types/work.ts";
import fetchHtml from "../fetchHtml.ts";

const listUrl = "https://sai-zen-sen.jp/comics/twi4/";
/** 大半が完結作品なので、更新中のものだけを対象にする */
const sectionSelector =
  "#lineup_latest > .section-body > section, #lineup_recent > .section-body > section, #lineup > .section-body > section";

/** 「毎日8:00更新」「毎週火曜更新」などの表記から更新曜日を割り出す */
function weekdaysOf(updateText: string): Weekday[] {
  if (updateText.includes("毎日")) {
    return [...weekdays];
  }

  const matched = weekdays.filter(
    (weekday) =>
      updateText.includes(`毎週${weekdayJa[weekday]}`) ||
      updateText.includes(`${weekdayJa[weekday]}曜更新`),
  );

  return matched;
}

export default async function twi4(): Promise<Record<Weekday, ParsedWork[]>> {
  const $ = cheerio.load(await fetchHtml(listUrl));
  const result = Object.fromEntries(
    weekdays.map((weekday) => [weekday, []]),
  ) as Record<Weekday, ParsedWork[]>;
  const seen = new Set<string>();

  $(sectionSelector).each((_, element) => {
    const section = $(element);

    if (section.find("em.is-completed").length > 0) {
      return;
    }

    const link = section.find("h3 a").first();
    const href = link.attr("href");
    const title = link.text().trim();

    if (typeof href !== "string" || title === "" || seen.has(title)) {
      return;
    }

    const updateText = section.children("ul").first().find("li").text();
    const days = weekdaysOf(updateText);

    if (days.length === 0) {
      return;
    }

    seen.add(title);

    const thumbnail = section.find("figure img").first().attr("src");
    const work: ParsedWork = {
      author: section.find(".hgroup p").first().text().trim() || null,
      thumbnailUrl:
        typeof thumbnail === "string"
          ? new URL(thumbnail, listUrl).toString()
          : null,
      title,
      url: new URL(href, listUrl).toString(),
    };

    days.forEach((weekday) => result[weekday].push(work));
  });

  return result;
}
