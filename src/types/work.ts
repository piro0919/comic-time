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

export type ParseOptions = {
  /** 曜日セクションの見出しに使う追加セレクタ。省略時は見出しタグとidから探す */
  headingSelector?: string;
  /** 1作品ぶんの要素セレクタ。省略時は li → a[href] の順で探す */
  itemSelector?: string;
};

export type SiteEntry = {
  /** ページ構造が特殊なサイトの専用処理の名前 */
  adapter?: string;
  /** 作品一覧ページ。mode が "site" のときは使わない */
  listUrl?: string;
  /**
   * weekly: 曜日見出しから作品を取る
   * flat: 曜日の区別が無い一覧から取り、サイトの更新曜日を全作品に割り当てる
   * site: 作品を取らずサイト単位で出す
   */
  mode: "flat" | "site" | "weekly";
  name: string;
  parseOptions?: ParseOptions;
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

export const weekdayJa: Record<Weekday, string> = {
  fri: "金",
  mon: "月",
  sat: "土",
  sun: "日",
  thu: "木",
  tue: "火",
  wed: "水",
};
