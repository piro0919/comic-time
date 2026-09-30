import * as cheerio from "cheerio";
import { type Episode } from "./episode";
import fetchText from "./fetchText";

/**
 * SHURO の話の一覧。作品ページ（/manga/<作品>/）の「エピソード一覧」に、いま読める回だけが並ぶ。
 * 最新話と第1話だけのように、途中の回は公開をやめていることが多い。
 * 台帳の住所が話（/episode/<番号>/）なら、画面上の作品への道から作品ページへ行く。
 *
 * 並びは作品によって崩れていて、第1話が先頭に来るものもある。話の住所の番号は
 * WordPress の投稿の番号で、書いた順に増えるので、それで新しい順に並べ直す。
 * どの回も誰でも読める。回ごとの公開日は出ていない。
 */
const origin = "https://shuro.world";
const workPattern = /^https:\/\/shuro\.world\/manga\/(?!type\/)[^/?#]+\/$/;

async function workPageOf(url: string): Promise<{ html: string; url: string }> {
  if (workPattern.test(url)) {
    return { html: await fetchText(url), url };
  }

  const $ = cheerio.load(await fetchText(url));
  const href = $("a.viewer-top").first().attr("href");
  const workUrl = href === undefined ? "" : new URL(href, origin).toString();

  if (!workPattern.test(workUrl)) {
    throw new Error(`SHURO: 作品ページが見つからない ${url}`);
  }

  return { html: await fetchText(workUrl), url: workUrl };
}

function postIdOf(url: string): number {
  return Number(/\/episode\/(\d+)/.exec(url)?.[1] ?? "0");
}

export default async function shuro(url: string): Promise<Episode[]> {
  const page = await workPageOf(url);
  const $ = cheerio.load(page.html);
  const list = $("h3")
    .filter((_, node) => $(node).text().includes("エピソード一覧"))
    .first()
    .closest("div:has(a[href*='/episode/'])");
  const episodes: Episode[] = [];

  list.find("a[href*='/episode/']").each((_, el) => {
    const item = $(el);
    const title = [
      item.find("p b").first().text().trim(),
      item.find("p").not(":has(b)").first().text().trim(),
    ]
      .filter((part) => part !== "")
      .join(" ");

    episodes.push({
      access: "free",
      date: null,
      title,
      url: new URL(item.attr("href") ?? "", origin).toString(),
    });
  });

  if (episodes.length === 0) {
    throw new Error(`SHURO: エピソード一覧が見つからない ${page.url}`);
  }

  return episodes.toSorted(
    (left, right) => postIdOf(right.url) - postIdOf(left.url),
  );
}
