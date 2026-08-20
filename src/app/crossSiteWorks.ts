import { type CardSite, siteOf, titleKey } from "./workCards";
import { recentWorks } from "./worksOfDay";

/** 同じ作品が複数サイトに載っているものだけ。鍵は揃えたタイトル */
export type CrossSites = Record<string, CardSite[]>;

/**
 * 直近7日ぶんを通して、同じ作品が複数のサイトに載っているものを拾う。
 * 講談社系のように、同じ作品が別々のサイトへ、別々の日に出ることがある。
 * その日ぶんだけを見ていると同じ作品だと分からないので、7日ぶんで作る。
 */
export default function crossSiteWorks(): CrossSites {
  const byTitle = new Map<string, CardSite[]>();

  // 新しい日から見る。同じサイトのぶんは、いちばん新しい住所だけを残す
  recentWorks().forEach((day) => {
    day.works.forEach((work) => {
      const key = titleKey(work.title);
      const found = byTitle.get(key) ?? [];

      if (found.some((site) => site.siteUrl === work.siteUrl)) {
        return;
      }

      found.push(siteOf(work));
      byTitle.set(key, found);
    });
  });

  return Object.fromEntries(
    [...byTitle.entries()].filter(([, sites]) => sites.length > 1),
  );
}
