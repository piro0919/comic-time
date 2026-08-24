import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import fetchHtml from "../fetchHtml.ts";

/**
 * comici で作られたサイトは、曜日別の連載一覧を更新順に並べ、
 * その日更新されたものに「更新」の印を付ける。
 * 一覧は複数ページに分かれるが、印の付いた作品が尽きたら先は見ない。
 *
 * 一覧に話への道は無いので、最新話は作品ページから拾う。既定の並びは古い順で、
 * 先頭は第1話になってしまう。新着順の /new を見て、その先頭を最新話とする。
 */
const maxPages = 10;
/** 月曜=1、日曜=7 */
const weekdays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/** 作品ページの新着順の先頭。読み取れなければ null にして、その作品だけ作品ページに戻す */
async function latestEpisode(
  seriesUrl: string,
  origin: string,
): Promise<null | string> {
  try {
    const $ = cheerio.load(
      await fetchHtml(`${seriesUrl.replace(/\/new$/, "")}/new`),
    );
    const href = $("a[href*='/episodes/']").first().attr("href");

    return href === undefined ? null : new URL(href, origin).toString();
  } catch {
    return null;
  }
}

function todayNumber(): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    weekday: "short",
  })
    .format(new Date())
    .toLowerCase();

  return weekdays.indexOf(weekday) + 1;
}

export default async function comici(
  origin: string,
  day = todayNumber(),
): Promise<ParsedWork[]> {
  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= maxPages; page += 1) {
    const $ = cheerio.load(
      await fetchHtml(`${origin}category/manga/day/${day}/${page}`),
    );
    const items = $(".series-list-item");

    if (items.length === 0) {
      break;
    }

    let updated = 0;

    items.each((_, el) => {
      const item = $(el);

      if (item.find(".g-updated-mark").length === 0) {
        return;
      }

      updated += 1;

      const title = item.find("[data-e2e='sliTitle']").first().text().trim();
      const href = item.find("a[href]").first().attr("href");

      if (title === "" || href === undefined || seen.has(title)) {
        return;
      }

      seen.add(title);

      const image = item.find("img").first();
      const thumbnail = image.attr("src") ?? image.attr("data-src");

      works.push({
        thumbnailUrl: thumbnail ?? null,
        title,
        url: new URL(href, origin).toString(),
      });
    });

    // 更新順に並ぶので、印の付いた作品が尽きたページから先は見ない
    if (updated === 0) {
      break;
    }
  }

  // 話の番号は作品ページにしか無いので、1作品につき1枚見に行く
  return Promise.all(
    works.map(async (work) => {
      const episode = await latestEpisode(work.url, origin);

      return episode === null ? work : { ...work, url: episode };
    }),
  );
}
