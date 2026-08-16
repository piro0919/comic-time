import { type IndexedWork, type SearchIndex, weekdays } from "@/types/work";
import { recentDateOf, worksOfDate } from "./worksOfDay";

/** 直近7日ぶんの更新から、検索用の一覧を組み立てる */
export default function searchIndex(): SearchIndex {
  const siteNames: string[] = [];
  const byUrl = new Map<string, IndexedWork>();

  weekdays.forEach((weekday, index) => {
    worksOfDate(recentDateOf(weekday)).forEach((work) => {
      const found = byUrl.get(work.url);

      if (found !== undefined) {
        found[3] |= 1 << index;

        return;
      }

      if (!siteNames.includes(work.siteName)) {
        siteNames.push(work.siteName);
      }

      byUrl.set(work.url, [
        work.title,
        work.url,
        siteNames.indexOf(work.siteName),
        1 << index,
      ]);
    });
  });

  return {
    siteNames,
    works: [...byUrl.values()].toSorted((a, b) =>
      a[0].localeCompare(b[0], "ja"),
    ),
  };
}
