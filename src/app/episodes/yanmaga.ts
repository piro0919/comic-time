import decodeEntities from "./decodeEntities";
import { type Episode } from "./episode";
import fetchText from "./fetchText";

/**
 * ヤンマガWebの話の一覧。作品ページの「もっと見る」が読む /comics/<作品>/episodes を叩く。
 *
 * 返ってくるのは JavaScript で、insertAdjacentHTML に渡す文字列の中に1話ずつ
 * li.mod-episode-item が入っている。sort=newer で新しい順になり、
 * limit で頼んだ数より少なく返ったら終わり。
 *
 * 読み方は js-modal（押すと会員登録の案内が出る）と data-is-free で分かる。
 * js-modal の無い回は、ログインせずに読める無料の回。
 * js-modal があって data-is-free が true の回は、会員なら1日の回数の内で無料で読める。
 * ここでの無料は「何もせずに読める」なので、これは有料の側に入れる。
 * data-is-free が false の回はポイントで読む。ヤンマガには先読みの印が無く、
 * 最新の数話がポイントだけで読める形なので、一番新しい無料の回より新しいものを先読みとみなす。
 */
const origin = "https://yanmaga.jp";
/** 1回で頼む数。長い連載でも100話台なので、たいてい1回で済む */
const pageSize = 150;

type Item = {
  date: null | string;
  locked: boolean;
  memberFree: boolean;
  title: string;
  url: string;
};

/** 台帳の住所は作品ページ（/comics/<作品>）か話のページ（/comics/<作品>/<番号>） */
function workUrlOf(url: string): string {
  const matched = /^\/comics\/[^/?#]+/.exec(new URL(url).pathname);

  if (matched === null) {
    throw new Error(`ヤンマガWeb: 作品の住所が読めない ${url}`);
  }

  return `${origin}${matched[0]}`;
}

/** insertAdjacentHTML に渡している文字列を取り出して1本の HTML にする */
function htmlOf(script: string): string {
  return [
    ...script.matchAll(
      /insertAdjacentHTML\('beforeend', "((?:[^"\\]|\\.)*)"\)/g,
    ),
  ]
    .map(
      (matched) =>
        JSON.parse(
          `"${(matched[1] ?? "").replaceAll("\\/", "/").replaceAll("\\'", "'")}"`,
        ) as string,
    )
    .join("");
}

function itemsOf(html: string): Item[] {
  return html
    .split(/<li class="mod-episode-item/)
    .slice(1)
    .flatMap((chunk) => {
      const head = chunk.slice(0, chunk.indexOf(">"));
      const path = /data-original-url="([^"]+)"/.exec(head)?.[1];
      const title = /data-episode-title="([^"]*)"/.exec(head)?.[1];

      if (path === undefined || title === undefined) {
        return [];
      }

      const date = /<time class="mod-episode-date">([^<]*)</.exec(chunk)?.[1];

      return [
        {
          date:
            date === undefined || date.trim() === ""
              ? null
              : date.trim().replaceAll("/", "-"),
          // 区切りの直後から最初の " までが、class の残り
          locked: /^[^"]*\bjs-modal\b/.test(head),
          memberFree: /data-is-free="true"/.test(head),
          title: decodeEntities(title),
          url: new URL(decodeEntities(path), origin).toString(),
        },
      ];
    });
}

export default async function yanmaga(url: string): Promise<Episode[]> {
  const workUrl = workUrlOf(url);
  const items: Item[] = [];

  for (let offset = 0; ; offset += pageSize) {
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(offset),
      sort: "newer",
    });
    const found = itemsOf(
      htmlOf(await fetchText(`${workUrl}/episodes?${params.toString()}`)),
    );

    items.push(...found);

    if (found.length < pageSize) {
      break;
    }
  }

  const latestFree = items.findIndex((item) => !item.locked);

  return items.map((item, index) => ({
    access: !item.locked
      ? "free"
      : !item.memberFree && index < latestFree
        ? "early"
        : "paid",
    date: item.date,
    title: item.title,
    url: item.url,
  }));
}
