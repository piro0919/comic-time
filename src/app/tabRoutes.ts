import { type Weekday, weekdayJa, weekdays } from "@/types/work";
import { dayHref } from "./days";

export const favoritesHref = "/favorites";

export const sitesHref = "/sites";

/** モバイルのタブの並び。お気に入り → 曜日7つ → サイト一覧 */
export function tabHrefs(days: Weekday[]): string[] {
  return [favoritesHref, ...days.map((day) => dayHref(day)), sitesHref];
}

/**
 * スワイプの向きから次に開くページを決める。
 * 両端は繋がっていて、お気に入りとサイト一覧は互いの隣になる。
 * 並びに載っていないページでは動かさない。
 */
export function nextTabHref(
  hrefs: string[],
  pathname: string,
  direction: -1 | 1,
): string | undefined {
  const current = hrefs.indexOf(pathname === "/" ? favoritesHref : pathname);

  if (current === -1) {
    return undefined;
  }

  return hrefs.at((current + direction + hrefs.length) % hrefs.length);
}

/** 今日を先頭に、そこから遡って一週間ぶんの曜日を並べる */
export function weekOrder(today: number): Weekday[] {
  return Array.from(
    { length: 7 },
    (_, back) => weekdays[(today - back + 7) % 7] ?? "sun",
  );
}

/**
 * タブに出している名前。スワイプの途中で行き先として見せる。
 * 曜日は、今日から遡ってその曜日に当たる日付を付ける。タブと同じ書き方にする
 */
export function tabLabel(href: string, today: Date): string | undefined {
  if (href === favoritesHref) {
    return "お気に入り";
  }

  if (href === sitesHref) {
    return "サイト一覧";
  }

  const day = weekdays.find((key) => dayHref(key) === href);

  if (day === undefined) {
    return undefined;
  }

  const back = (today.getDay() - weekdays.indexOf(day) + 7) % 7;
  const date = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - back,
  );

  return `${date.getMonth() + 1}/${date.getDate()}（${weekdayJa[day]}）`;
}
