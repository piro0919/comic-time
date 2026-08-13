import {
  type ParsedWork,
  type Weekday,
  weekdays,
} from "../../../src/types/work.ts";
import fetchHtml from "../fetchHtml.ts";

const origin = "https://www.ganganonline.com";
/** 連載一覧は「2026.08.13更新」の形で最終更新日を持つ。直近1週間ぶんを曜日に割り振る */
const updatedPattern = /(\d{4})\.(\d{2})\.(\d{2})/;
const weekMs = 7 * 24 * 60 * 60 * 1000;

type RensaiResponse = {
  pageProps: {
    data: {
      titleSections: {
        titles: {
          header: string;
          imageUrl?: null | string;
          isNovel?: boolean;
          titleId: number;
          updated?: null | string;
        }[];
      }[];
    };
  };
};

/** ビルドごとに変わるため、トップページから拾う */
async function fetchBuildId(): Promise<string> {
  const html = await fetchHtml(origin);
  const matched = /"buildId":"([^"]+)"/.exec(html);

  if (matched === null) {
    throw new Error("buildId が見つかりません");
  }

  return matched[1];
}

export default async function ganganOnline(): Promise<
  Record<Weekday, ParsedWork[]>
> {
  const buildId = await fetchBuildId();
  const json = await fetchHtml(`${origin}/_next/data/${buildId}/rensai.json`);
  const { pageProps } = JSON.parse(json) as RensaiResponse;
  const result = Object.fromEntries(
    weekdays.map((weekday) => [weekday, []]),
  ) as Record<Weekday, ParsedWork[]>;
  const now = Date.now();

  pageProps.data.titleSections.forEach(({ titles }) => {
    titles.forEach((title) => {
      const matched = updatedPattern.exec(title.updated ?? "");

      if (matched === null || title.isNovel === true) {
        return;
      }

      const updated = new Date(
        `${matched[1]}-${matched[2]}-${matched[3]}T00:00:00+09:00`,
      );

      // 1週間より古い更新は、今週その曜日に更新されたとは限らない
      if (now - updated.getTime() > weekMs) {
        return;
      }

      const weekday = weekdays[updated.getDay()];

      if (weekday === undefined) {
        return;
      }

      result[weekday].push({
        author: null,
        thumbnailUrl:
          typeof title.imageUrl === "string"
            ? new URL(title.imageUrl, origin).toString()
            : null,
        title: title.header,
        url: `${origin}/title/${title.titleId}`,
      });
    });
  });

  return result;
}
