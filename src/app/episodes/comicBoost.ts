import decodeEntities from "./decodeEntities";
import { type Episode } from "./episode";
import fetchText from "./fetchText";

/**
 * コミックブーストの話の一覧。作品ページ（/content/<id>）に新しい順で10話ずつ並ぶ。
 * 2ページ目からは ?p=2 の形。最後より先を頼んでも最後のページが返るので、
 * 1ページ目の「最後のページへ」の番号まで読んで止める。
 *
 * 1話ぶんは a[id^="product-"] で、題名は data-title、日付は .update-date にある。
 * 無料の回は /product/<id> へそのまま飛び、data-coin が 0。
 * コインで読む回は js-read が付き、道は data-href に ?coin=26 付きで入っている。
 * 先読みの印は無い。最新の回はたいてい無料で、一番新しい無料の回より新しい
 * 鍵付きの回だけを先読みとみなす。
 */
const origin = "https://comic-boost.com";

/** 台帳の住所は作品ページ（/content/01750001）か読む画面（/product/01750005） */
function workUrlOf(url: string): string {
  const matched = /\/(content|product)\/(\d{4})(\d{4})/.exec(url);

  if (matched?.[2] === undefined) {
    throw new Error(`コミックブースト: 作品の番号が読めない ${url}`);
  }

  // 話の番号は作品の番号の頭4桁に通し番号を付けたもの。作品は通し番号 0001
  return `${origin}/content/${matched[2]}0001`;
}

/** 送りの並びにある番号の最大。ほかの作品への道を拾わないよう、この作品の住所に限る */
function lastPageOf(html: string, workUrl: string): number {
  const path = new URL(workUrl).pathname;

  return Math.max(
    1,
    ...[...html.matchAll(/href="([^"?]+)\?p=(\d+)"/g)]
      .filter((matched) => matched[1] === path)
      .map((matched) => Number(matched[2])),
  );
}

type Item = {
  date: null | string;
  free: boolean;
  title: string;
  url: string;
};

function itemsOf(html: string): Item[] {
  return html
    .split(/<a id="product-/)
    .slice(1)
    .flatMap((chunk) => {
      const head = chunk.slice(0, chunk.indexOf(">"));
      const id = /data-id="(\d+)"/.exec(head)?.[1];
      const title = /data-title="([^"]*)"/.exec(head)?.[1];

      if (id === undefined || title === undefined) {
        return [];
      }

      const date = /<p class="update-date">([^<]*)</.exec(
        chunk.slice(0, chunk.indexOf("</a>")),
      )?.[1];

      return [
        {
          date:
            date === undefined || date.trim() === ""
              ? null
              : date.trim().replaceAll("/", "-"),
          free:
            /\bjs-read\b/.test(head) === false &&
            /data-coin="0"/.test(head) &&
            /href="\/product\//.test(head),
          title: decodeEntities(title),
          url: `${origin}/product/${id}`,
        },
      ];
    });
}

export default async function comicBoost(url: string): Promise<Episode[]> {
  const workUrl = workUrlOf(url);
  const first = await fetchText(workUrl);
  const rest = await Promise.all(
    Array.from({ length: lastPageOf(first, workUrl) - 1 }, async (_, index) =>
      fetchText(`${workUrl}?p=${index + 2}`),
    ),
  );
  const items = [first, ...rest].flatMap(itemsOf);
  const latestFree = items.findIndex((item) => item.free);

  return items.map((item, index) => ({
    access: item.free ? "free" : index < latestFree ? "early" : "paid",
    date: item.date,
    title: item.title,
    url: item.url,
  }));
}
