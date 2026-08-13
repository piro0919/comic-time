import fs from "fs/promises";
import path from "path";
import {
  type ParsedWork,
  type SiteEntry,
  type Weekday,
  weekdayJa,
  weekdays,
  type Work,
} from "../../src/types/work.ts";
import comicFuz from "./adapters/comicFuz.ts";
import comici from "./adapters/comici.ts";
import comicWalker from "./adapters/comicWalker.ts";
import ganganOnline from "./adapters/ganganOnline.ts";
import twi4 from "./adapters/twi4.ts";
import yanmaga from "./adapters/yanmaga.ts";
import zerosumOnline from "./adapters/zerosumOnline.ts";
import fetchHtml from "./fetchHtml.ts";
import parseWeeklyList, { extractWorks } from "./parseWeeklyList.ts";

/** ページ構造が特殊で汎用パーサに乗らないサイト */
const adapters: Record<
  string,
  (site: SiteEntry) => Promise<Record<Weekday, ParsedWork[]>>
> = {
  comicFuz,
  comici,
  comicWalker,
  ganganOnline,
  twi4,
  yanmaga,
  zerosumOnline,
};

type MetaEntry = {
  count: number;
  scrapedAt: string;
};

type Meta = Record<string, MetaEntry>;

/** 前回のこの割合を下回ったら、サイト側の変更を疑って据え置く */
const dropThreshold = 0.5;
const dataDir = path.join(process.cwd(), "data", "works");
const metaPath = path.join(dataDir, "meta.json");
/** 更新曜日が変わったサイトを取りこぼさないよう、この日数を過ぎたら曜日に関係なく取り直す */
const staleDays = 7;

function todayWeekday(): Weekday {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    weekday: "short",
  }).format(new Date());

  return formatted.toLowerCase() as Weekday;
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function isStale(entry: MetaEntry | undefined): boolean {
  if (entry === undefined) {
    return true;
  }

  const elapsed = Date.now() - new Date(entry.scrapedAt).getTime();

  return Number.isNaN(elapsed) || elapsed > staleDays * 24 * 60 * 60 * 1000;
}

function shouldScrape(site: SiteEntry, meta: Meta, weekday: Weekday): boolean {
  if (site.mode === "site" || typeof site.listUrl !== "string") {
    return false;
  }

  return site.updateDay.includes(weekdayJa[weekday]) || isStale(meta[site.url]);
}

export default async function scrape(): Promise<void> {
  const all = process.argv.includes("--all");

  /** 曜日の区別が無いサイトは、サイトの更新曜日すべてに同じ作品を並べる */
  function spreadOverUpdateDay(
    works: ParsedWork[],
    site: SiteEntry,
  ): Record<Weekday, ParsedWork[]> {
    return Object.fromEntries(
      weekdays.map((day) => [
        day,
        site.updateDay.includes(weekdayJa[day]) ? works : [],
      ]),
    ) as Record<Weekday, ParsedWork[]>;
  }

  const weekday = todayWeekday();
  const sites = await readJson<SiteEntry[]>(
    path.join(process.cwd(), "src", "data", "sites.json"),
    [],
  );
  const meta = await readJson<Meta>(metaPath, {});
  const targets = sites.filter((site) =>
    all
      ? site.mode !== "site" && typeof site.listUrl === "string"
      : shouldScrape(site, meta, weekday),
  );

  console.log(`[scrape] ${weekday} 対象 ${targets.length} サイト`);

  const buckets = new Map<Weekday, Work[]>();

  await Promise.all(
    weekdays.map(async (day) => {
      buckets.set(
        day,
        await readJson<Work[]>(path.join(dataDir, `${day}.json`), []),
      );
    }),
  );

  const updated = new Set<Weekday>();
  const failed: string[] = [];

  for (const site of targets) {
    if (typeof site.listUrl !== "string") {
      continue;
    }

    try {
      const adapter =
        typeof site.adapter === "string" ? adapters[site.adapter] : undefined;
      const parsed =
        adapter !== undefined
          ? await adapter(site)
          : site.mode === "flat"
            ? spreadOverUpdateDay(
                extractWorks(
                  await fetchHtml(site.listUrl),
                  site.listUrl,
                  site.parseOptions?.itemSelector ?? "li",
                ),
                site,
              )
            : parseWeeklyList(
                await fetchHtml(site.listUrl),
                site.listUrl,
                site.parseOptions,
              );
      const total = weekdays.reduce((sum, day) => sum + parsed[day].length, 0);
      const previous = meta[site.url]?.count ?? 0;

      // 0件やごっそり減った場合は、サイト側の作りが変わった可能性が高い
      if (total === 0 || total < previous * dropThreshold) {
        console.error(
          `[scrape] ${site.name}: ${total}件（前回${previous}件）のため据え置き`,
        );
        failed.push(site.name);
        continue;
      }

      weekdays.forEach((day) => {
        const kept = (buckets.get(day) ?? []).filter(
          (work) => work.siteUrl !== site.url,
        );
        const fresh = parsed[day].map<Work>((work) => ({
          author: work.author,
          siteName: site.name,
          siteUrl: site.url,
          thumbnailUrl: work.thumbnailUrl,
          title: work.title,
          updateTime: site.updateTime,
          url: work.url,
        }));

        buckets.set(day, [...kept, ...fresh]);
        updated.add(day);
      });

      meta[site.url] = { count: total, scrapedAt: new Date().toISOString() };

      console.log(`[scrape] ${site.name}: ${total}件`);
    } catch (error) {
      console.error(`[scrape] ${site.name}: 失敗`, error);
      failed.push(site.name);
    }
  }

  await fs.mkdir(dataDir, { recursive: true });
  await Promise.all(
    [...updated].map(async (day) => {
      const works = (buckets.get(day) ?? []).toSorted((a, b) =>
        a.title.localeCompare(b.title, "ja"),
      );

      await fs.writeFile(
        path.join(dataDir, `${day}.json`),
        `${JSON.stringify(works, null, 2)}\n`,
      );
    }),
  );
  await fs.writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`);

  console.log(`[scrape] 更新した曜日: ${[...updated].join(", ") || "なし"}`);

  if (failed.length > 0) {
    // 気付かないまま古いデータが残り続けないよう、失敗として終える
    console.error(`[scrape] 取得できなかったサイト: ${failed.join(", ")}`);
    process.exitCode = 1;
  }
}

await scrape();
