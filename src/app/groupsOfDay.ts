import fs from "fs";
import path from "path";
import sites from "@/data/sites.json";
import {
  type DateKey,
  type DayKey,
  type SiteEntry,
  type SiteGroup,
  weekdayJa,
  weekdays,
  type Work,
} from "@/types/work";
import siteOgp from "../../data/site-ogp.json";

const ogpByUrl = siteOgp as Record<string, null | string>;
const dataDir = path.join(process.cwd(), "data", "works");
const dayMs = 24 * 60 * 60 * 1000;

function jaOf(day: DayKey): string {
  return day === "irregular" ? "不定期" : weekdayJa[day];
}

function dateKeyOf(date: Date): DateKey {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Tokyo",
    year: "numeric",
  }).format(date);
}

/** 曜日ごとに、直近のその曜日の日付を返す。今日はその曜日ぶんとして扱う */
export function recentDateOf(day: DayKey, from = new Date()): DateKey | null {
  if (day === "irregular") {
    return null;
  }

  const target = weekdays.indexOf(day);

  for (let back = 0; back < 7; back += 1) {
    const date = new Date(from.getTime() - back * dayMs);
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo",
      weekday: "short",
    })
      .format(date)
      .toLowerCase();

    if (weekdays.indexOf(weekday as DayKey) === target) {
      return dateKeyOf(date);
    }
  }

  return null;
}

/** その日に更新された作品。ファイルが無ければ空 */
export function worksOfDate(date: DateKey): Work[] {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(dataDir, `${date}.json`), "utf-8"),
    ) as Work[];
  } catch {
    return [];
  }
}

/**
 * その曜日に並ぶサイトと作品を組み立てる。
 * 曜日ごとにページを分けているので、1曜日ぶんだけをクライアントへ送る。
 */
export default function groupsOfDay(day: DayKey): SiteGroup[] {
  const groups = new Map<string, SiteGroup>();

  (sites as SiteEntry[]).forEach((site) => {
    if (site.mode !== "site" || !site.updateDay.includes(jaOf(day))) {
      return;
    }

    groups.set(site.url, {
      siteName: site.name,
      siteUrl: site.url,
      thumbnailUrl: ogpByUrl[site.url] ?? null,
      updateDay: site.updateDay,
      updateTime: site.updateTime,
      works: [],
    });
  });

  const date = recentDateOf(day);

  if (date !== null) {
    worksOfDate(date).forEach((work) => {
      const group = groups.get(work.siteUrl) ?? {
        siteName: work.siteName,
        siteUrl: work.siteUrl,
        thumbnailUrl: null,
        updateDay: jaOf(day),
        updateTime: work.updateTime,
        works: [],
      };

      group.works.push({
        author: work.author,
        thumbnailUrl: work.thumbnailUrl,
        title: work.title,
        url: work.url,
      });
      groups.set(work.siteUrl, group);
    });
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      works: group.works.toSorted((a, b) =>
        a.title.localeCompare(b.title, "ja"),
      ),
    }))
    .toSorted((a, b) => a.siteName.localeCompare(b.siteName, "ja"));
}

export const dayKeys: DayKey[] = [...weekdays, "irregular"];
