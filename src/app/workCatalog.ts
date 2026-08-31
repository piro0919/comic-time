import fs from "fs";
import path from "path";
import {
  type CatalogEntry,
  daysOf,
  type Weekday,
  weekdayJa,
  weekdays,
} from "@/types/work";

/**
 * 作品の台帳を読む。書き出しているのは scripts/catalog。
 *
 * data/works と違って古い作品も残る。更新が月1でも作品ページが消えないようにするため。
 */
const catalogPath = path.join(process.cwd(), "data", "catalog.json");

let loaded: CatalogEntry[] | undefined = undefined;

/** 題名の順。1700件あるので一度読んだら使い回す */
export function catalog(): CatalogEntry[] {
  if (loaded === undefined) {
    try {
      loaded = JSON.parse(
        fs.readFileSync(catalogPath, "utf-8"),
      ) as CatalogEntry[];
    } catch {
      loaded = [];
    }
  }

  return loaded;
}

/**
 * 住所は日本語のまま持っている。Next は生成した経路を符号化した形で渡してくるので、
 * 台帳と突き合わせる前に戻す。戻さないと日本語の題名が全部 404 になる。
 */
function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export function workOf(slug: string): CatalogEntry | undefined {
  const decoded = decodeSlug(slug);

  return catalog().find((entry) => entry.slug === decoded);
}

export function workHref(slug: string): string {
  return `/works/${slug}`;
}

/**
 * 「火曜・金曜」にする。
 * 台帳に貯まっているのは更新を見た曜日で、サイトが決めた更新日ではない。
 * 隔週や月1の作品は1曜日しか出ない。文言もそれに合わせる。
 */
export function seenDaysLabel(dayBits: number): string {
  const days = daysOf(dayBits);

  return days.length === 0
    ? ""
    : days.map((day) => `${weekdayJa[day]}曜`).join("・");
}

/**
 * その曜日に更新を見た作品。題名の順で返す。
 *
 * data/works は7日で消えるので、そちらから引くと隔週や月1の作品が落ちる。
 * 曜日ページから作品ページへ入る道として使うぶんなので、台帳から引く。
 */
export function worksOfWeekday(day: Weekday): CatalogEntry[] {
  const bit = 1 << weekdays.indexOf(day);

  return catalog()
    .filter((entry) => (entry.dayBits & bit) !== 0)
    .toSorted((a, b) => a.title.localeCompare(b.title, "ja"));
}

/**
 * そのサイトで読める作品。題名の順で返す。
 *
 * 突き合わせはサイトの入り口の URL で行う。台帳のサイト名は表記が変わることがあり、
 * 名前で持つと過去に貯めたぶんが外れるため。
 */
export function worksOfSiteUrl(siteUrl: string): CatalogEntry[] {
  return catalog()
    .filter((entry) => entry.sites.some((site) => site.siteUrl === siteUrl))
    .toSorted((a, b) => a.title.localeCompare(b.title, "ja"));
}
