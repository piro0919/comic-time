import { type Work } from "@/types/work";
import siteSlug from "./siteSlug";

export type CardSite = {
  iconUrl: string;
  name: string;
  /** サイトの入り口。同じサイトを二重に数えないための目印にする */
  siteUrl: string;
  url: string;
};

/** 画面に出すカード1枚ぶん。サイトごとに1枚で、まとめない */
export type WorkCard = {
  /** 複数サイトに載っている作品だけ、どのサイトのぶんかを示す印を出す */
  badge: CardSite | null;
  foundAt: string;
  thumbnailUrl: null | string;
  title: string;
  url: string;
  /** 同じ作品が載っている全サイトぶんのURL。お気に入りはまとめて見る */
  urls: string[];
};

/**
 * 突き合わせのためにタイトルを揃える。
 * 全角半角（NFKC）と、波ダッシュ・全角チルダの違い、空白だけを吸収する。
 * 括弧の中身は落とさない。落とすと別作品を同じものとして扱ってしまう。
 */
export function titleKey(title: string): string {
  return title
    .normalize("NFKC")
    .replace(/[〜～]/g, "~")
    .replace(/\s+/g, "")
    .toLowerCase();
}

/** どのサイトで読めるかを1つぶん。印の絵は scripts/siteIcons が集めたもの */
export function siteOf(work: Work): CardSite {
  return {
    iconUrl: `/site-icons/${siteSlug(work.siteUrl)}.png`,
    name: work.siteName,
    siteUrl: work.siteUrl,
    url: work.url,
  };
}

/**
 * 作品をカードに移す。並びは渡された順のまま。
 * crossSites に載っている作品は、複数サイトで読めるものなので、
 * どのサイトのぶんかを印で出し、お気に入りは全サイトぶんをまとめて見る。
 */
export default function workCards(
  works: Work[],
  crossSites: Record<string, CardSite[]> = {},
): WorkCard[] {
  return works.map((work) => {
    const key = titleKey(work.title);
    const known = Object.hasOwn(crossSites, key) ? crossSites[key] : [];
    const own = siteOf(work);

    return {
      badge: known.length > 1 ? own : null,
      foundAt: work.foundAt,
      thumbnailUrl: work.thumbnailUrl,
      title: work.title,
      url: work.url,
      urls:
        known.length > 1
          ? [
              work.url,
              ...known
                .filter((site) => site.url !== work.url)
                .map((site) => site.url),
            ]
          : [work.url],
    };
  });
}
