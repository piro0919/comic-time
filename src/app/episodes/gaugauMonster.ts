import * as cheerio from "cheerio";
import { type Episode } from "./episode";
import fetchText from "./fetchText";

/**
 * がうがうモンスターの話の一覧。作品の /episodes のページ1枚に全話が新しい順で並ぶ。
 *
 * 読めるかどうかは各話の札の文字で分かる。
 * 「無料で読む」は無料、「アプリで読む」はウェブでは読めずアプリで読む回なので有料とする。
 * 「アプリで先読み」の回は話ごとの住所が無く、どれもアプリの案内へ飛ぶので外す。
 * 住所が重なると一覧の並びを区別できない。
 * 「公開予定」「公開終了」の回はリンクが無く読めないので、それも外す。
 * 公開日は無料の回にだけ「2026年09月24日 更新」の形で載る。
 */
const freeLabel = "無料で読む";
const appLabel = "アプリで読む";

function workUrlOf(url: string): string {
  const matched =
    /^(https:\/\/gaugau\.futabanet\.jp\/list\/work\/[0-9a-f]+)/.exec(url);

  if (matched?.[1] === undefined) {
    throw new Error(`がうがうモンスター: 作品の番号が読めない ${url}`);
  }

  return `${matched[1]}/episodes`;
}

function dateOf(text: string): null | string {
  const matched = /(\d{4})年(\d{1,2})月(\d{1,2})日\s*更新/.exec(text);

  return matched === null
    ? null
    : `${matched[1]}-${matched[2]?.padStart(2, "0")}-${matched[3]?.padStart(2, "0")}`;
}

export default async function gaugauMonster(url: string): Promise<Episode[]> {
  const listUrl = workUrlOf(url);
  const $ = cheerio.load(await fetchText(listUrl));
  const episodes: Episode[] = [];

  $(".episode__grid a").each((_, el) => {
    const item = $(el);
    const href = item.attr("href");
    const label = item.find(".episode__button").first().text().trim();

    if (
      href === undefined ||
      !href.includes("/episodes/") ||
      (label !== freeLabel && label !== appLabel)
    ) {
      return;
    }

    episodes.push({
      access: label === freeLabel ? "free" : "paid",
      date: dateOf(item.text()),
      title: [
        item.find(".episode__num").first().text().trim(),
        item.find(".episode__title").first().text().trim(),
      ]
        .filter((part) => part !== "")
        .join(" "),
      url: new URL(href, listUrl).toString(),
    });
  });

  if (episodes.length === 0) {
    throw new Error(`がうがうモンスター: 話が1つも読めない ${listUrl}`);
  }

  return episodes;
}
