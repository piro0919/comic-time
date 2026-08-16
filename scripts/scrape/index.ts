import fs from "fs/promises";
import path from "path";
import { type SiteEntry, type Work } from "../../src/types/work.ts";
import todayKey from "./date.ts";
import sources from "./sources/index.ts";

/**
 * その日更新された作品を集めて data/works/<日付>.json に書く。
 * 見に行くのは当日ぶんだけで、過去の日のファイルには触らない。
 * 取れなかったサイトはその日を空にする。古いまま残すより、壊れたと分かる方を選ぶ。
 *
 * 1日に何度も走るので、前の回に無かった作品はそのとき初めて更新されたとみなし、
 * 見つけた時刻を控える。画面はこれを使って新しいものから並べる。
 */
const dataDir = path.join(process.cwd(), "data", "works");
/** 画面に出す日数。これより古い日のファイルは消す */
const keepDays = 7;

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

export default async function scrape(): Promise<void> {
  const today = todayKey();
  const sites = await readJson<SiteEntry[]>(
    path.join(process.cwd(), "src", "data", "sites.json"),
    [],
  );
  const filePath = path.join(dataDir, `${today}.json`);
  const previous = await readJson<Work[]>(filePath, []);
  const found = new Map(previous.map((work) => [work.url, work.foundAt]));
  const now = new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(new Date());
  const failed: string[] = [];

  console.log(`[scrape] ${today} 対象 ${sources.length} サイト`);

  const collected: Work[] = [];

  for (const source of sources) {
    const site = sites.find((entry) => entry.url === source.siteUrl);

    if (site === undefined) {
      console.error(`[scrape] ${source.siteUrl}: sites.json に無い`);
      failed.push(source.siteUrl);
      continue;
    }

    try {
      const works = await source.fetchToday();

      collected.push(
        ...works.map<Work>((work) => ({
          // 前の回に見つけていれば、そのときの時刻を引き継ぐ
          foundAt: found.get(work.url) ?? now,
          siteName: site.name,
          siteUrl: site.url,
          thumbnailUrl: work.thumbnailUrl,
          title: work.title,
          url: work.url,
        })),
      );

      console.log(`[scrape] ${site.name}: ${works.length}件`);
    } catch (error) {
      // このサイトは今日ぶんが空になる
      console.error(`[scrape] ${site.name}: 失敗`, error);
      failed.push(site.name);
    }
  }

  // 同じ日に何度も走るので、まだ対応していないサイトのぶんは消さずに残す
  const untouched = previous.filter(
    (work) => !sources.some((source) => source.siteUrl === work.siteUrl),
  );
  // 同じ作品を配信しているサイトがあるので、作品名が重なったら先に取れた方を残す
  const merged: Work[] = [];
  const titles = new Set<string>();

  [...untouched, ...collected].forEach((work) => {
    if (titles.has(work.title)) {
      return;
    }

    titles.add(work.title);
    merged.push(work);
  });

  const works = merged.toSorted((a, b) => a.title.localeCompare(b.title, "ja"));

  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(works, null, 2)}\n`);

  const kept = new Set(
    Array.from({ length: keepDays }, (_, back) => {
      const date = new Date(
        new Date(`${today}T00:00:00+09:00`).getTime() -
          back * 24 * 60 * 60 * 1000,
      );

      return new Intl.DateTimeFormat("en-CA", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "Asia/Tokyo",
        year: "numeric",
      }).format(date);
    }),
  );
  const stale = (await fs.readdir(dataDir)).filter(
    (name) =>
      /^\d{4}-\d{2}-\d{2}\.json$/.test(name) && !kept.has(name.slice(0, 10)),
  );

  await Promise.all(
    stale.map((name) => fs.rm(path.join(dataDir, name), { force: true })),
  );

  console.log(
    `[scrape] ${works.length}件を書き出し / 消した日 ${stale.length}件`,
  );

  if (failed.length > 0) {
    console.error(`[scrape] 取得できなかったサイト: ${failed.join(", ")}`);
    process.exitCode = 1;
  }
}

await scrape();
