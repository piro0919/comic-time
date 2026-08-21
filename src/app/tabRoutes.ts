import { type Weekday, weekdays } from "@/types/work";
import { dayHref } from "./days";

export const favoritesHref = "/favorites";

export const sitesHref = "/sites";

/** モバイルのタブの並び。お気に入り → 曜日7つ → サイト一覧 */
export function tabHrefs(days: Weekday[]): string[] {
  return [favoritesHref, ...days.map((day) => dayHref(day)), sitesHref];
}

/**
 * スワイプの向きから次に開くページを決める。
 * 並びに載っていないページと、両端から先へ出る向きでは動かさない。
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

  const next = current + direction;

  if (next < 0 || next >= hrefs.length) {
    return undefined;
  }

  return hrefs.at(next);
}

/** 今日を先頭に、そこから遡って一週間ぶんの曜日を並べる */
export function weekOrder(today: number): Weekday[] {
  return Array.from(
    { length: 7 },
    (_, back) => weekdays[(today - back + 7) % 7] ?? "sun",
  );
}
