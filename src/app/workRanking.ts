import rankingEventName from "./rankingEventName";
import { type CardSite, siteOf, titleKey } from "./workCards";
import { recentWorks } from "./worksOfDay";

/**
 * 直近1週間で開かれた回数の多い作品。
 *
 * 数は Vercel Web Analytics のカスタムイベント work-open から取る。
 * 作品カードのリンクを押したときに1件送っていて、載っているのは題名だけ。
 * サムネイルや読みに行く先は、こちらで直近7日の取得結果と突き合わせて補う。
 *
 * 同じ作品が複数サイトに載っていることがあるので、題名を揃えて合算する。
 * 「読まれた作品」を出したいのであって、サイトごとの取り分ではないため。
 */
const apiUrl = "https://api.vercel.com/v1/query/web-analytics/events/aggregate";
const projectId = "prj_3MBib48G63tzuA8iguQStNi7zzhr";
const teamId = "team_tIxzTwttTmEQTeqpsmsJgXNV";
const dayMs = 24 * 60 * 60 * 1000;
/** 画面に出す上限。これ以上は数が小さすぎて順位の意味が薄い */
const limit = 20;

export type RankedWork = {
  /** 開かれた回数 */
  count: number;
  /** 1位から数えた順位。同数なら同じ順位になる */
  rank: number;
  /** どのサイトで読めるか。複数サイトに載っていれば全部 */
  sites: CardSite[];
  thumbnailUrl: null | string;
  title: string;
  /** 押したときに開く先。いちばん新しく見つかったサイトのぶん */
  url: string;
};

export type EventRow = {
  count: number;
  eventData: null | string;
  visitors: number;
};

/** Analytics から題名ごとの回数を取る。取れなければ空を返す */
async function openCounts(since: Date, until: Date): Promise<EventRow[]> {
  const token = process.env.VERCEL_ANALYTICS_TOKEN;

  if (token === undefined || token === "") {
    return [];
  }

  const query = new URLSearchParams({
    by: "eventData/title",
    filter: `eventName eq '${rankingEventName}'`,
    limit: String(limit * 2),
    projectId,
    since: since.toISOString(),
    teamId,
    until: until.toISOString(),
  });
  const response = await fetch(`${apiUrl}?${query}`, {
    // ページ側の revalidate に任せる。ここでは持ち越さない
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    return [];
  }

  const body = (await response.json()) as { data: EventRow[] };

  return body.data;
}

/**
 * 直近7日の取得結果から、題名ごとの見た目と行き先を作る。
 * 新しい日を先に見ているので、最初に当たったものが最新の回になる。
 */
function worksByTitle(): Map<string, RankedWork> {
  const found = new Map<string, RankedWork>();

  for (const { works } of recentWorks()) {
    for (const work of works) {
      const key = titleKey(work.title);
      const known = found.get(key);

      if (known === undefined) {
        found.set(key, {
          count: 0,
          rank: 0,
          sites: [siteOf(work)],
          thumbnailUrl: work.thumbnailUrl,
          title: work.title,
          url: work.url,
        });

        continue;
      }

      // 同じサイトの別の回は数えない。載っているサイトの数を出したいだけ
      if (!known.sites.some((site) => site.siteUrl === work.siteUrl)) {
        known.sites.push(siteOf(work));
      }

      known.thumbnailUrl ??= work.thumbnailUrl;
    }
  }

  return found;
}

/**
 * 順位を振る。同じ回数なら同じ順位にして、次はその人数ぶん飛ばす。
 * 3回が2件並んだら 1,1,3 になる。
 */
export function ranked(works: RankedWork[]): RankedWork[] {
  let rank = 0;
  let previous = -1;

  return works.map((work, index) => {
    if (work.count !== previous) {
      rank = index + 1;
      previous = work.count;
    }

    return { ...work, rank };
  });
}

/**
 * 題名ごとの回数にまとめる。
 * 表記の揺れと、同じ作品を載せている別サイトのぶんを、ここで足し合わせる。
 */
export function totalsByTitle(rows: EventRow[]): Map<string, number> {
  const totals = new Map<string, number>();

  for (const row of rows) {
    if (row.eventData === null || row.eventData === "") {
      continue;
    }

    const key = titleKey(row.eventData);

    totals.set(key, (totals.get(key) ?? 0) + row.count);
  }

  return totals;
}

export default async function workRanking(from = new Date()): Promise<
  RankedWork[]
> {
  const rows = await openCounts(new Date(from.getTime() - 7 * dayMs), from);
  const works = worksByTitle();
  const totals = totalsByTitle(rows);
  const found: RankedWork[] = [];

  for (const [key, count] of totals) {
    const work = works.get(key);

    // 一週間の一覧から消えた作品は出さない。押しても読みに行けないため
    if (work !== undefined) {
      found.push({ ...work, count });
    }
  }

  return ranked(
    found.toSorted((a, b) => {
      const diff = b.count - a.count;

      return diff === 0 ? a.title.localeCompare(b.title, "ja") : diff;
    }),
  ).slice(0, limit);
}
