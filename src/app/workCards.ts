import { type Work } from "@/types/work";
import siteSlug from "./siteSlug";
import { titleKey } from "./workSlug";

// 住所と同じ揃え方を使う。読む側の import はここのままにしておく
export { titleKey };

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
  /** 昔の形での登録。見つけたら今の見出しに移す */
  legacyKeys: string[];
  thumbnailUrl: null | string;
  title: string;
  url: string;
  /** お気に入りの見出し。サイトと題名の組から作る */
  workKey: string;
};

/**
 * お気に入りの見出し。サイトと題名の組を32ビット2本ぶんに畳んで36進で書く。
 * サイトは入り口のURLで表す。台帳の名前を書き直しても登録が切れないため。
 *
 * 話ごとにURLが変わるサイトがあるため、URLでは持てない。題名だけで持つと、
 * 同じ作品を載せている別サイトの更新まで出てしまう。読むのは1つのサイトなので、
 * サイトを混ぜずに、サイトごとの登録にする。
 *
 * 日本語のまま持つと共有リンクが縮まらず、QRに載る件数が3分の1になる。
 * 読める必要はない見出しなので、短さを取る。
 */
export function workKey(siteUrl: string, title: string): string {
  const text = `${siteUrl}\u0000${titleKey(title)}`;

  let low = 0x811c9dc5;
  let high = 0x1000193;

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);

    low = Math.imul(low ^ code, 0x1000193) >>> 0;
    high = Math.imul(high ^ code, 0x85ebca6b) >>> 0;
  }

  return `${low.toString(36)}${high.toString(36)}`;
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
 * crossSites に載っている作品は複数サイトで読めるものなので、
 * どのサイトのぶんかを印で出す。登録はサイトごとに分けたままにする。
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
      // 作品URLで持っていた頃と、サイト名で見出しを作っていた頃のぶん
      legacyKeys: [work.url, workKey(work.siteName, work.title)],
      thumbnailUrl: work.thumbnailUrl,
      title: work.title,
      url: work.url,
      workKey: workKey(work.siteUrl, work.title),
    };
  });
}
