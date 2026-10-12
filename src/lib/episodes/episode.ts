/** 作品ページに並べる話1つぶん */
export type Episode = {
  /**
   * いま何も使わずに読めるか。鍵付きの回は、先読み（最新話を会員やポイントで
   * 先に読ませる回）と、それ以外の有料の回に分ける。
   * サイトが示していなければ null にして、どれとも言わない。
   */
  access: "early" | "free" | "paid" | null;
  /** 公開日。「2026-09-30」の形。載っていないサイトは null */
  date: null | string;
  /** 「第12話 副題」の形 */
  title: string;
  url: string;
};

/**
 * 1サイトぶんの話の一覧の取り方。台帳に控えた住所（話か作品のページ）から、
 * その作品の全話を新しい順に返す。取れなければ例外を投げる。
 */
export type EpisodeSource = (url: string) => Promise<Episode[]>;
