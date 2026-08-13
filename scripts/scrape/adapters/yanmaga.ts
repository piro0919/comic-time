import {
  type ParsedWork,
  type Weekday,
  weekdays,
} from "../../../src/types/work.ts";
import fetchHtml from "../fetchHtml.ts";
import parseWeeklyList, { extractWorks } from "../parseWeeklyList.ts";

const listUrl = "https://yanmaga.jp/comics/series";
const moreUrl = "https://yanmaga.jp/comics/series/more";
const weekNames: Record<Weekday, string> = {
  fri: "friday",
  mon: "monday",
  sat: "saturday",
  sun: "sunday",
  thu: "thursday",
  tue: "tuesday",
  wed: "wednesday",
};
/** 一覧は曜日ごとに12件で切られ、続きは JS 片として返ってくる */
const pageSize = 12;

/** 続きは1作品ごとの insertAdjacentHTML として返るので、文字列リテラルを全部つなぐ */
function unescapeChunk(script: string): string {
  const matches = script.matchAll(/'beforeend',\s*("(?:[^"\\]|\\.)*")/g);

  return [...matches]
    .map((matched) => {
      try {
        return JSON.parse(matched[1]) as string;
      } catch {
        return "";
      }
    })
    .join("");
}

export default async function yanmaga(): Promise<
  Record<Weekday, ParsedWork[]>
> {
  const parsed = parseWeeklyList(await fetchHtml(listUrl), listUrl);

  for (const weekday of weekdays) {
    let offset = pageSize;

    // 続きが尽きるまで辿る。続きが無い曜日は 404 が返るので、そこで打ち切る
    while (parsed[weekday].length >= offset) {
      let chunk = "";

      try {
        chunk = unescapeChunk(
          await fetchHtml(
            `${moreUrl}?week=${weekNames[weekday]}&offset=${offset}`,
            0,
          ),
        );
      } catch {
        break;
      }

      const works = extractWorks(chunk, listUrl, "a[href]");

      if (works.length === 0) {
        break;
      }

      parsed[weekday] = [...parsed[weekday], ...works];
      offset += pageSize;
    }
  }

  return parsed;
}
