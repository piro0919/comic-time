import fs from "fs/promises";
import path from "path";
import {
  type DailyWorks,
  type DateKey,
  type SiteEntry,
  type Work,
} from "../../src/types/work.ts";
import comicFuz from "./adapters/comicFuz.ts";
import comici from "./adapters/comici.ts";
import comicWalker from "./adapters/comicWalker.ts";
import gigaviewer from "./adapters/gigaviewer.ts";
import zerosumOnline from "./adapters/zerosumOnline.ts";
import { recentKeys, todayKey } from "./dates.ts";
import fetchHtml from "./fetchHtml.ts";
import parseDailyList from "./parseDailyList.ts";

/** 一覧ページの HTML では取れず、専用の処理が要るサイト */
const adapters: Record<string, (site: SiteEntry) => Promise<DailyWorks>> = {
  comicFuz,
  comici,
  comicWalker,
  gigaviewer,
  zerosumOnline,
};

type MetaEntry = {
  /** 直近 keepDays 日ぶんの合計。取得できたかの目安に使う */
  count: number;
  scrapedAt: string;
};

type Meta = Record<string, MetaEntry>;

const dataDir = path.join(process.cwd(), "data", "works");
const metaPath = path.join(dataDir, "meta.json");

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

async function collect(site: SiteEntry): Promise<DailyWorks> {
  const adapter =
    typeof site.adapter === "string" ? adapters[site.adapter] : undefined;

  if (adapter !== undefined) {
    return adapter(site);
  }

  if (site.daily === undefined) {
    return {};
  }

  const url = site.daily.url ?? site.url;

  return parseDailyList(await fetchHtml(url), url, site.daily);
}

export default async function scrape(): Promise<void> {
  const today = todayKey();
  const dates = recentKeys(today);
  const sites = await readJson<SiteEntry[]>(
    path.join(process.cwd(), "src", "data", "sites.json"),
    [],
  );
  const meta = await readJson<Meta>(metaPath, {});
  const targets = sites.filter(
    (site) => site.daily !== undefined || typeof site.adapter === "string",
  );

  console.log(`[scrape] ${today} 対象 ${targets.length} サイト`);

  const buckets = new Map<DateKey, Work[]>();

  await Promise.all(
    dates.map(async (date) => {
      buckets.set(
        date,
        await readJson<Work[]>(path.join(dataDir, `${date}.json`), []),
      );
    }),
  );

  const touched = new Set<DateKey>();
  const failed: string[] = [];

  for (const site of targets) {
    try {
      const daily = await collect(site);
      const total = Object.values(daily).reduce(
        (sum, works) => sum + works.length,
        0,
      );

      if (total === 0) {
        // その日更新が無いことはあるが、7日ぶんまるごと空なら取得の失敗を疑う
        console.error(`[scrape] ${site.name}: 0件のため据え置き`);
        failed.push(site.name);
        continue;
      }

      // 取れた日だけを入れ替える。取れなかった日の履歴はそのまま残す
      Object.entries(daily).forEach(([date, works]) => {
        if (!buckets.has(date)) {
          return;
        }

        const kept = (buckets.get(date) ?? []).filter(
          (work) => work.siteUrl !== site.url,
        );
        const fresh = works.map<Work>((work) => ({
          author: work.author,
          siteName: site.name,
          siteUrl: site.url,
          thumbnailUrl: work.thumbnailUrl,
          title: work.title,
          updateTime: site.updateTime,
          url: work.url,
        }));

        buckets.set(date, [...kept, ...fresh]);
        touched.add(date);
      });

      meta[site.url] = { count: total, scrapedAt: new Date().toISOString() };

      const summary = Object.entries(daily)
        .filter(([date]) => dates.includes(date))
        .map(([date, works]) => `${date.slice(5)}:${works.length}`)
        .join(" ");

      console.log(`[scrape] ${site.name}: ${summary}`);
    } catch (error) {
      console.error(`[scrape] ${site.name}: 失敗`, error);
      failed.push(site.name);
    }
  }

  await fs.mkdir(dataDir, { recursive: true });
  await Promise.all(
    [...touched].map(async (date) => {
      const works = (buckets.get(date) ?? []).toSorted((a, b) =>
        a.title.localeCompare(b.title, "ja"),
      );

      await fs.writeFile(
        path.join(dataDir, `${date}.json`),
        `${JSON.stringify(works, null, 2)}\n`,
      );
    }),
  );

  // 画面に出さなくなった日のファイルは残さない
  const stale = (await fs.readdir(dataDir)).filter(
    (name) =>
      /^\d{4}-\d{2}-\d{2}\.json$/.test(name) &&
      !dates.includes(name.slice(0, 10)),
  );

  await Promise.all(
    stale.map((name) => fs.rm(path.join(dataDir, name), { force: true })),
  );
  await fs.writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`);

  console.log(
    `[scrape] 更新した日: ${[...touched].toSorted().join(", ") || "なし"} / 消した日: ${stale.length}件`,
  );

  if (failed.length > 0) {
    // 気付かないまま古いデータが残り続けないよう、失敗として終える
    console.error(`[scrape] 取得できなかったサイト: ${failed.join(", ")}`);
    process.exitCode = 1;
  }
}

await scrape();
