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

export type DayKey = "irregular" | Weekday;

/** 日本時間の暦日。"2026-08-17" の形 */
export type DateKey = string;

/** 更新のあった日ごとの作品。その日に更新が無ければキーごと持たない */
export type DailyWorks = Record<DateKey, ParsedWork[]>;

/**
 * 「その日更新された作品」の取り出し方。
 * headingText はその見出しの節を今日ぶんとして扱い、
 * sectionSelector は節ごとに日付を読んで振り分ける。
 */
export type DailyOptions = {
  /** 節の中の日付表記。省略時は節全体のテキストから月日を探す */
  dateSelector?: string;
  /** 「今日の更新」など、今日ぶんの節を指す見出しの文言 */
  headingText?: string;
  itemSelector: string;
  /** 日付を持つ節。過去ぶんもまとめて取れるサイト向け */
  sectionSelector?: string;
  /** 今日ぶんの節を直に指すセレクタ。見出しの文言に頼れないサイト向け */
  todaySelector?: string;
  /** 取得先。省略時はサイトのトップページ */
  url?: string;
};

export type SiteEntry = {
  /** ページ構造が特殊なサイトの専用処理の名前 */
  adapter?: string;
  /** その日更新された作品の取り出し方。adapter がある場合は使わない */
  daily?: DailyOptions;
  /** 作品一覧ページ。取得の入口が daily.url と違うサイトだけ持つ */
  listUrl?: string;
  /**
   * works: その日更新された作品を取る
   * site: 作品を取らずサイト単位で出す
   */
  mode: "site" | "works";
  name: string;
  updateDay: string;
  updateTime: string;
  url: string;
};

export type Work = {
  author: null | string;
  siteName: string;
  siteUrl: string;
  thumbnailUrl: null | string;
  title: string;
  updateTime: string;
  url: string;
};

/** 一覧ページやAPIから拾った直後の作品。サイト名などは後で足す */
export type ParsedWork = {
  author: null | string;
  thumbnailUrl: null | string;
  title: string;
  url: string;
};

export type SiteGroup = {
  siteName: string;
  siteUrl: string;
  /** サイト単位で出すサイトのカード画像。作品を持つサイトでは使わない */
  thumbnailUrl: null | string;
  updateDay: string;
  updateTime: string;
  /** サイト名などはグループ側が持つので、作品からは省く */
  works: ParsedWork[];
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

export const weekdayJa: Record<Weekday, string> = {
  fri: "金",
  mon: "月",
  sat: "土",
  sun: "日",
  thu: "木",
  tue: "火",
  wed: "水",
};
