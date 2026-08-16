export const weekdays = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
] as const;

export type Weekday = (typeof weekdays)[number];

/** 日本時間の暦日。"2026-08-17" の形 */
export type DateKey = string;

/** サイトの台帳。取り方そのものは scripts/scrape/sources に書く */
export type SiteEntry = {
  name: string;
  updateDay: string;
  updateTime: string;
  url: string;
};

export type Work = {
  /** その日のうちで最初に見つけた時刻。「12:34」の形 */
  foundAt: string;
  siteName: string;
  siteUrl: string;
  thumbnailUrl: null | string;
  title: string;
  url: string;
};

/** 一覧ページやAPIから拾った直後の作品。サイト名などは後で足す */
export type ParsedWork = {
  thumbnailUrl: null | string;
  title: string;
  url: string;
};

/**
 * 検索用の作品一覧。4000件近くあるので、項目名の繰り返しを避けて配列で持つ。
 * [タイトル, URL, サイト番号, 曜日ビット]
 */
export type IndexedWork = [string, string, number, number];

export type SearchIndex = {
  siteNames: string[];
  works: IndexedWork[];
};

/** 曜日は1ビットずつ。日曜が最下位ビット */
export function daysOf(bits: number): Weekday[] {
  return weekdays.filter((_, index) => (bits & (1 << index)) !== 0);
}

export const weekdayJa: Record<Weekday, string> = {
  fri: "金",
  mon: "月",
  sat: "土",
  sun: "日",
  thu: "木",
  tue: "火",
  wed: "水",
};
