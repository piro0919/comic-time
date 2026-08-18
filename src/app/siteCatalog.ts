import fs from "fs";
import path from "path";
import sitesJson from "@/data/sites.json";
import { type DateKey, type SiteEntry, type Work } from "@/types/work";
import siteSlug from "./siteSlug";
import { recentWorks } from "./worksOfDay";

export type Site = SiteEntry & { imageUrl: null | string; slug: string };

const coverDir = path.join(process.cwd(), "public", "site-covers");

/**
 * 看板の絵。scripts/siteImages が縮めて置いたものだけを見る。
 * 各社の CDN から原寸で読むと、25枚で 10MB を超えるため。
 */
function coverOf(slug: string): null | string {
  try {
    fs.accessSync(path.join(coverDir, `${slug}.webp`));

    return `/site-covers/${slug}.webp`;
  } catch {
    return null;
  }
}

export { default as siteSlug } from "./siteSlug";

/** 台帳の並びのまま返す */
export function sites(): Site[] {
  return (sitesJson as SiteEntry[]).map((site) => {
    const slug = siteSlug(site.url);

    return { ...site, imageUrl: coverOf(slug), slug };
  });
}

export function siteOf(slug: string): Site | undefined {
  return sites().find((site) => site.slug === slug);
}

export function siteHref(slug: string): string {
  return `/sites/${slug}`;
}

/** 「日月火」を「日曜・月曜・火曜」にする。「不定期」などはそのまま */
export function updateDayLabel(updateDay: string): string {
  const days = [...updateDay].filter((character) =>
    "日月火水木金土".includes(character),
  );

  return days.length === 0
    ? updateDay
    : days.map((day) => `${day}曜`).join("・");
}

/** そのサイトの直近7日ぶん。更新が無かった日は落とす */
export function worksOfSite(site: Site): { date: DateKey; works: Work[] }[] {
  return recentWorks()
    .map((day) => ({
      date: day.date,
      works: day.works.filter((work) => work.siteUrl === site.url),
    }))
    .filter((day) => day.works.length > 0);
}
