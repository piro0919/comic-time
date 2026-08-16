import * as cheerio from "cheerio";
import { type ParsedWork } from "../../../src/types/work.ts";
import todayKey from "../date.ts";
import fetchHtml from "../fetchHtml.ts";

/**
 * GigaViewer で作られたサイトが共通で持つ Atom フィード。
 * 更新された話が日時つきで並ぶので、今日ぶんだけを拾う。
 * 作品名は content に、話のタイトルは title に入る。
 */
export default async function gigaViewerAtom(
  origin: string,
  date = todayKey(),
): Promise<ParsedWork[]> {
  const feedUrl = new URL("/atom", origin).toString();
  const $ = cheerio.load(await fetchHtml(feedUrl), { xmlMode: true });
  const works: ParsedWork[] = [];
  const seen = new Set<string>();

  $("entry").each((_, el) => {
    const entry = $(el);
    const updated = entry.find("updated").first().text();
    const title = entry.find("content").first().text().trim();
    const href = entry.find("link[href]").first().attr("href");

    if (updated === "" || title === "" || href === undefined) {
      return;
    }

    const day = new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "Asia/Tokyo",
      year: "numeric",
    }).format(new Date(updated));

    // 同じ作品が1日に複数話更新されることがあるので、作品ごとに1件にまとめる
    if (day !== date || seen.has(title)) {
      return;
    }

    seen.add(title);

    const thumbnail = entry.find("link[rel='enclosure']").first().attr("href");

    works.push({
      thumbnailUrl: thumbnail ?? null,
      title,
      url: new URL(href, origin).toString(),
    });
  });

  return works;
}
