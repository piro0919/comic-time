import { type ParsedWork } from "../../../src/types/work.ts";
import todayKey from "../date.ts";

/**
 * カドコミは日付ごとの更新一覧を返す API を持つ。
 * 更新は11時なので、それより前に走ったときは今日の日付がまだ入っていない。
 *
 * 応答には最新話の符号も入っている。作品ページの各話一覧は古い順で、
 * しかも先頭の数話しか出ないので、最新話はこの符号からしか組み立てられない。
 */
const apiUrl = "https://comic-walker.com/api/daily/new";

type DailyResponse = {
  resources: {
    date: string;
    works: {
      code: string;
      episode?: null | { code: string; type: string };
      thumbnail?: null | string;
      title: string;
    }[];
  }[];
};

export default async function comicWalker(
  date = todayKey(),
): Promise<ParsedWork[]> {
  const res = await fetch(apiUrl, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  const { resources } = (await res.json()) as DailyResponse;
  const today = resources.find((resource) => resource.date === date);

  return (today?.works ?? []).map((work) => {
    const detailUrl = `https://comic-walker.com/detail/${work.code}`;
    const episode = work.episode;

    return {
      thumbnailUrl: work.thumbnail ?? null,
      title: work.title,
      url:
        episode?.type === "latest"
          ? `${detailUrl}/episodes/${episode.code}`
          : detailUrl,
    };
  });
}
