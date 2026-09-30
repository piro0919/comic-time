import * as cheerio from "cheerio";
import { type Episode } from "./episode";
import fetchText from "./fetchText";

/**
 * ツイ４の話の一覧。作品ページのバックナンバーに全話が新しい順で並ぶ。
 * 台帳の住所は作品ページ（/comics/twi4/<作品>/）か話（…/<作品>/0209.html）のどちらか。
 *
 * どの回も誰でも読める。公開日はどこにも出ていない。
 * 見出しは「水藤流『張り合い』 #0209」の形で、作者名はどの回も同じなので
 * 「#0209 張り合い」に並べ替える。形が違えばそのまま出す。
 */
function workUrlOf(url: string): string {
  const matched = /^(https:\/\/sai-zen-sen\.jp\/comics\/twi4\/[^/?#]+\/)/.exec(
    url,
  );

  if (matched?.[1] === undefined) {
    throw new Error(`ツイ４: 作品の住所が読めない ${url}`);
  }

  return matched[1];
}

function titleOf(text: string): string {
  const matched = /『(.*)』\s*(#\d+)$/.exec(text);

  return matched === null ? text : `${matched[2]} ${matched[1]}`;
}

export default async function twi4(url: string): Promise<Episode[]> {
  const workUrl = workUrlOf(url);
  const $ = cheerio.load(await fetchText(workUrl));
  const episodes: Episode[] = [];

  $("#backnumbers li a[href]").each((_, el) => {
    const link = $(el);
    const title = link.text().trim();

    if (title === "") {
      return;
    }

    episodes.push({
      access: "free",
      date: null,
      title: titleOf(title),
      url: new URL(link.attr("href") ?? "", workUrl).toString(),
    });
  });

  if (episodes.length === 0) {
    throw new Error(`ツイ４: バックナンバーが見つからない ${workUrl}`);
  }

  return episodes;
}
