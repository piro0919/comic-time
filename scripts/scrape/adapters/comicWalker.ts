import { type DailyWorks } from "../../../src/types/work.ts";
import { recentKeys } from "../dates.ts";

/** 日付ごとの更新一覧。直近7日ぶんがそのまま返る */
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

export default async function comicWalker(): Promise<DailyWorks> {
  const res = await fetch(apiUrl, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  const { resources } = (await res.json()) as DailyResponse;
  const wanted = new Set(recentKeys());
  const result: DailyWorks = {};

  resources.forEach(({ date, works }) => {
    if (!wanted.has(date)) {
      return;
    }

    result[date] = works.map((work) => ({
      author: null,
      thumbnailUrl: work.thumbnail ?? null,
      title: work.title,
      url: `https://comic-walker.com/detail/${work.code}`,
    }));
  });

  return result;
}
