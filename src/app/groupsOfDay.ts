import sites from "@/data/sites.json";
import {
  type DayKey,
  type SiteEntry,
  type SiteGroup,
  weekdayJa,
  weekdays,
  type Work,
} from "@/types/work";
import siteOgp from "../../data/site-ogp.json";
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
const ogpByUrl = siteOgp as Record<string, null | string>;

function jaOf(day: DayKey): string {
  return day === "irregular" ? "不定期" : weekdayJa[day];
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

  if (day !== "irregular") {
    (buckets[day] ?? []).forEach((work) => {
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
