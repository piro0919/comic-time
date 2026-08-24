import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import todayKey from "../date.ts";
import fetchHtml from "../fetchHtml.ts";
import resolveEpisodes from "../resolveEpisodes.ts";

/**
 * COMICメテオはきら星ポータルの中のレーベルで、
 * 掲載日ごとの見出しと作品の並びが交互に置かれている。
 * 見出しは月と日が別々の要素に入る。
 *
 * 一覧に話への道は無いが、作品ページに「最新話を読む」の道が出ている。
 * 読み切りにはその道が無く、代わりに「読み切りを読む」が1つだけ置かれる。
 */
const topUrl = "https://kirapo.jp/meteor";

/** 作品ページの「最新話を読む」。読み取れなければ null にして、その作品だけ作品ページに戻す */
async function latestEpisode(workUrl: string): Promise<null | string> {
  try {
    const $ = cheerio.load(await fetchHtml(workUrl));
    const links = $("a.episode-read");
    const latest = links.filter((_, el) => $(el).text().includes("最新話"));
    const chosen =
      latest.length > 0 ? latest : links.length === 1 ? links : null;
    const href = chosen?.first().attr("href");

    return href === undefined ? null : new URL(href, topUrl).toString();
  } catch {
    return null;
  }
}

export default async function comicMeteor(
  date = todayKey(),
): Promise<ParsedWork[]> {
  const $ = cheerio.load(await fetchHtml(topUrl));
  const [, month, day] = date.split("-");
  const heading = $("#titles-container .d-flex")
    .filter((_, el) => {
      const parts = $(el)
        .find(".heading-text")
        .map((_, node) => $(node).text().trim())
        .get();

      return parts[0] === month && parts[1] === day;
    })
    .first();

  if (heading.length === 0) {
    return [];
  }

  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  heading
    .next(".grid-group")
    .find("a[href]")
    .each((_, el) => {
      const item = $(el);
      const href = item.attr("href");
      const image = item.find("img[alt]").first();
      const title = image.attr("alt")?.trim() ?? "";

      if (href === undefined || title === "" || seen.has(title)) {
        return;
      }

      seen.add(title);

      works.push({
        thumbnailUrl: image.attr("src") ?? null,
        title,
        url: new URL(href, topUrl).toString(),
      });
    });

  // 話の番号は作品ページにしか無いので、1作品につき1枚見に行く
  return resolveEpisodes(works, latestEpisode);
}
