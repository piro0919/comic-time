import { type Episode } from "./episode";
import fetchText from "./fetchText";

/**
 * ガンガンONLINEの話の一覧。作品ページの __NEXT_DATA__ に新しい順で入っている。
 *
 * Web に置かれているのは最新の数話と第1話あたりだけで、続きはアプリで読む。
 * status の無い回は、ログインせずに Web で読める。publishingPeriod
 * 「2026.09.21〜2026.10.04」の始まりを公開日とする。第1話のように期間の無い回もある。
 * status 3 はアプリで先に読める次の回、2 は Web での公開が終わった回で、
 * どちらも Web の住所を開くと作品ページへ戻される。読めないので外す。
 */
type Chapter = {
  id: number;
  mainText?: string;
  publishingPeriod?: string;
  status?: number;
  subText?: string;
};

type NextData = {
  props?: {
    pageProps?: { data?: { default?: { chapters?: Chapter[] } } };
  };
};

const origin = "https://www.ganganonline.com";

/** 台帳の住所は話のページ（/title/2385/chapter/127431）か作品ページ（/title/2385） */
function titleIdOf(url: string): string {
  const matched = /\/title\/(\d+)/.exec(url);

  if (matched?.[1] === undefined) {
    throw new Error(`ガンガンONLINE: 作品の番号が読めない ${url}`);
  }

  return matched[1];
}

function dateOf(period: string | undefined): null | string {
  const matched = /^(\d{4})\.(\d{2})\.(\d{2})/.exec(period ?? "");

  return matched === null ? null : `${matched[1]}-${matched[2]}-${matched[3]}`;
}

export default async function ganganOnline(url: string): Promise<Episode[]> {
  const titleId = titleIdOf(url);
  const embedded = /<script id="__NEXT_DATA__"[^>]*>([^<]*)<\/script>/.exec(
    await fetchText(`${origin}/title/${titleId}`),
  )?.[1];

  if (embedded === undefined) {
    throw new Error(`ガンガンONLINE: __NEXT_DATA__ が見つからない ${url}`);
  }

  const chapters = (JSON.parse(embedded) as NextData).props?.pageProps?.data
    ?.default?.chapters;

  if (chapters === undefined) {
    throw new Error(`ガンガンONLINE: 話の一覧が見つからない ${url}`);
  }

  return chapters
    .filter((chapter) => chapter.status === undefined)
    .map((chapter) => ({
      access: "free",
      date: dateOf(chapter.publishingPeriod),
      title: [chapter.mainText ?? "", chapter.subText ?? ""]
        .map((part) => part.trim())
        .filter((part) => part !== "")
        .join(" "),
      url: `${origin}/title/${titleId}/chapter/${chapter.id}`,
    }));
}
