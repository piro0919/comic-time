import {
  type ParsedWork,
  type Weekday,
  weekdays,
} from "../../../src/types/work.ts";

/** 日付ごとの更新一覧。直近7日ぶんがそのまま曜日に対応する */
const apiUrl = "https://comic-walker.com/api/daily/new";

type DailyResponse = {
  resources: {
    date: string;
    works: {
      code: string;
      thumbnail?: null | string;
      title: string;
    }[];
  }[];
};

export default async function comicWalker(): Promise<
  Record<Weekday, ParsedWork[]>
> {
  const res = await fetch(apiUrl, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  const { resources } = (await res.json()) as DailyResponse;
  const result = Object.fromEntries(
    weekdays.map((weekday) => [weekday, []]),
  ) as Record<Weekday, ParsedWork[]>;

  resources.forEach(({ date, works }) => {
    const weekday = weekdays[new Date(`${date}T00:00:00+09:00`).getDay()];

    if (weekday === undefined) {
      return;
    }

    result[weekday] = works.map((work) => ({
      author: null,
      thumbnailUrl: work.thumbnail ?? null,
      title: work.title,
      url: `https://comic-walker.com/detail/${work.code}`,
    }));
  });

  return result;
}
