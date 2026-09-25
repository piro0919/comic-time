import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import fetchHtml from "../fetchHtml.ts";

/**
 * マンガUP!のトップには「今日の更新（水曜日）」の区画がある。
 * サイトが今日と言っているものをそのまま採る。こちらで日付を判断しない。
 *
 * 区画に並ぶのは作品への道だけで、話への道は無い。作品ページ止まりにする。
 * 見出しの並びの隣に「もっと見る」があるので、作品の住所の形で選り分ける。
 *
 * **区画は開くたびに違う8作品を出す。** 今日の更新（2026-09-26 の土曜で31作品）から
 * 抽選しているため、1回読むだけでは大半を取りこぼし、回ごとに顔ぶれが入れ替わって
 * data の差分と本番のビルドを生んでいた。新しい作品が出なくなるまで読み直して束ねる。
 * それでも漏れたぶんは、同じ日の前の回に見つけたものを scrape 側で残して拾う。
 *
 * 「もっと見る」の先（/series）は曜日の連載をすべて並べ、今日更新していない作品まで
 * 含むので使えない。作品ページにも更新日は載っていない。
 */
const topUrl = "https://www.manga-up.com/";
const headingText = "今日の更新";
/** 読み直す上限 */
const maxReads = 20;
/** 新しい作品が続けてこの回数出なければ、出揃ったとみなす */
const quietReads = 6;

function parse(html: string): ParsedWork[] {
  const $ = cheerio.load(html);
  const heading = $("h2")
    .filter((_, el) => $(el).text().includes(headingText))
    .first();

  if (heading.length === 0) {
    throw new Error("マンガUP!: 今日の更新の区画が見つからない");
  }

  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  heading
    .closest("section")
    .find("a[href*=\"/titles/\"]")
    .each((_, el) => {
      const link = $(el);
      const href = link.attr("href");
      const image = link.find("img").first();
      const title = image.attr("alt")?.trim() ?? "";

      if (href === undefined || title === "" || seen.has(title)) {
        return;
      }

      seen.add(title);

      const thumbnail = image.attr("src");

      works.push({
        thumbnailUrl:
          thumbnail === undefined
            ? null
            : new URL(thumbnail, topUrl).toString(),
        title,
        url: new URL(href, topUrl).toString(),
      });
    });

  return works;
}

export default async function mangaUp({
  pause = 500,
}: { pause?: number } = {}): Promise<ParsedWork[]> {
  const byTitle = new Map<string, ParsedWork>();

  let quiet = 0;

  for (let read = 0; read < maxReads && quiet < quietReads; read += 1) {
    if (read > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, pause);
      });
    }

    const before = byTitle.size;

    parse(await fetchHtml(topUrl)).forEach((work) => {
      if (!byTitle.has(work.title)) {
        byTitle.set(work.title, work);
      }
    });

    quiet = byTitle.size === before ? quiet + 1 : 0;
  }

  return [...byTitle.values()];
}
