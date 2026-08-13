import { type DayKey, weekdays, type Work } from "@/types/work";
import fri from "../../data/works/fri.json";
import mon from "../../data/works/mon.json";
import sat from "../../data/works/sat.json";
import sun from "../../data/works/sun.json";
import thu from "../../data/works/thu.json";
import tue from "../../data/works/tue.json";
import wed from "../../data/works/wed.json";

const buckets: Record<string, Work[]> = {
  fri,
  mon,
  sat,
  sun,
  thu,
  tue,
  wed,
};

/**
 * 検索用の作品一覧。4000件近くあるので、項目名の繰り返しを避けて配列で持つ。
 * [タイトル, URL, サイト番号, 作者, 曜日ビット]
 */
export type IndexedWork = [string, string, number, string, number];

export type SearchIndex = {
  siteNames: string[];
  works: IndexedWork[];
};

/** 曜日は1ビットずつ。日曜が最下位ビット */
export function daysOf(bits: number): DayKey[] {
  return weekdays.filter((_, index) => (bits & (1 << index)) !== 0);
}

export default function searchIndex(): SearchIndex {
  const siteNames: string[] = [];
  const byUrl = new Map<string, IndexedWork>();

  weekdays.forEach((weekday, index) => {
    (buckets[weekday] ?? []).forEach((work) => {
      const found = byUrl.get(work.url);

      if (found !== undefined) {
        found[4] |= 1 << index;

        return;
      }

      if (!siteNames.includes(work.siteName)) {
        siteNames.push(work.siteName);
      }

      byUrl.set(work.url, [
        work.title,
        work.url,
        siteNames.indexOf(work.siteName),
        work.author ?? "",
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
