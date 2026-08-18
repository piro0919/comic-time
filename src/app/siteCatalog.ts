import fs from "fs";
import path from "path";
import sitesJson from "@/data/sites.json";
import { type DateKey, type SiteEntry, type Work } from "@/types/work";
import { recentWorks } from "./worksOfDay";

export type Site = SiteEntry & { imageUrl: null | string; slug: string };

/** 看板の絵。scripts/siteImages が書き出す。無ければ画面側で代わりを出す */
function siteImages(): Record<string, string> {
  try {
    return JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), "data", "siteImages.json"),
        "utf-8",
      ),
    ) as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * ページの住所は URL から作る。台帳には持たせない。
 * 末尾のラベル（.com や .jp）は住所として意味がないので落とす。
 * パスを持つサイトは、その最後の区切りまで入れて他と区別する。
 */
export function siteSlug(url: string): string {
  const { hostname, pathname } = new URL(url);
  const labels = hostname.replace(/^www\./, "").split(".");
  const host = labels.slice(0, -1).join("-");
  const tail = pathname.split("/").filter(Boolean).at(-1);

  return tail === undefined ? host : `${host}-${tail}`;
}

/** 台帳の並びのまま返す */
export function sites(): Site[] {
  const images = siteImages();

  return (sitesJson as SiteEntry[]).map((site) => ({
    ...site,
    imageUrl: images[site.url] ?? null,
    slug: siteSlug(site.url),
  }));
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
