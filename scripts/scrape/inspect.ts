import { weekdays } from "../../src/types/work.ts";
import fetchHtml from "./fetchHtml.ts";
import parseWeeklyList from "./parseWeeklyList.ts";

/**
 * 単一ページに対してパーサを試し、曜日ごとの件数と先頭の作品名を出す確認用。
 * 使い方: node scripts/scrape/inspect.ts <url> [itemSelector]
 */
const [url, itemSelector] = process.argv.slice(2);

if (typeof url !== "string") {
  console.error("usage: node scripts/scrape/inspect.ts <url> [itemSelector]");
  process.exit(1);
}

const html = await fetchHtml(url);
const parsed = parseWeeklyList(html, url, { itemSelector });

weekdays.forEach((weekday) => {
  const works = parsed[weekday];
  const sample = works
    .slice(0, 3)
    .map(
      (work) => `${work.title}${work.author === null ? "" : `/${work.author}`}`,
    )
    .join(", ");

  console.log(`${weekday}: ${works.length} ${sample}`);
});
