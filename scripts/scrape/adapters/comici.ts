import {
  type ParsedWork,
  type SiteEntry,
  type Weekday,
  weekdays,
} from "../../../src/types/work.ts";
import fetchHtml from "../fetchHtml.ts";
import { extractWorks } from "../parseWeeklyList.ts";

/** comici 基盤のサイト。曜日別の一覧が月曜=1で用意されている */
const dayNumbers: Record<Weekday, number> = {
  fri: 5,
  mon: 1,
  sat: 6,
  sun: 7,
  thu: 4,
  tue: 2,
  wed: 3,
};
const maxPages = 10;

export default async function comici(
  site: SiteEntry,
): Promise<Record<Weekday, ParsedWork[]>> {
  const origin = new URL(site.url).origin;
  const result = Object.fromEntries(
    weekdays.map((weekday) => [weekday, []]),
  ) as Record<Weekday, ParsedWork[]>;

  for (const weekday of weekdays) {
    const seen = new Set<string>();

    for (let page = 1; page <= maxPages; page += 1) {
      const url = `${origin}/category/manga/day/${dayNumbers[weekday]}/${page}`;
      const works = extractWorks(
        await fetchHtml(url),
        origin,
        ".series-list-item",
      ).filter((work) => !seen.has(work.url));

      if (works.length === 0) {
        break;
      }

      works.forEach((work) => seen.add(work.url));
      result[weekday] = [...result[weekday], ...works];
    }
  }

  return result;
}
