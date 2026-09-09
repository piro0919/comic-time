import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import todayKey from "../date.ts";
import fetchHtml from "../fetchHtml.ts";

/**
 * がうがうモンスターのトップには「無料コミック更新情報」の並びがあり、
 * 絵の上に「9/9 更新」の札が乗る。年は書かれていないので月日だけで突き合わせる。
 *
 * リンクは話そのものを指すので、作品ページを見に行く必要はない。
 */
const topUrl = "https://gaugau.futabanet.jp/";

export default async function gaugauMonster(
  date = todayKey(),
): Promise<ParsedWork[]> {
  const $ = cheerio.load(await fetchHtml(topUrl));
  const [, month, day] = date.split("-");
  const wanted = `${Number(month)}/${Number(day)}`;
  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  $(".comicsSlider__gridItem").each((_, el) => {
    const item = $(el);
    const badge = item.find(".icon").first().text().replace(/\s+/g, "");

    if (badge !== `${wanted}更新`) {
      return;
    }

    const title = item.find(".comics__name").first().text().trim();
    const href = item.find("a[href]").first().attr("href");

    if (title === "" || href === undefined || seen.has(title)) {
      return;
    }

    seen.add(title);

    const thumbnail = item.find("img").first().attr("src");

    works.push({
      thumbnailUrl:
        thumbnail === undefined ? null : new URL(thumbnail, topUrl).toString(),
      title,
      url: new URL(href, topUrl).toString(),
    });
  });

  return works;
}
