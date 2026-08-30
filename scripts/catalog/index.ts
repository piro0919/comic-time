import fs from "fs/promises";
import path from "path";
import workSlug, { titleKey } from "../../src/app/workSlug.ts";
import {
  type CatalogEntry,
  type DateKey,
  type Work,
  weekdays,
} from "../../src/types/work.ts";

/**
 * data/works の7日ぶんを畳んで data/catalog.json に貯める。
 *
 * data/works は7日で消える。消える前にここへ移しておかないと、更新が月1の作品は
 * ページごと消えたり出たりを繰り返す。検索から来た人が 404 に当たるので、
 * 作品ページはこの台帳だけを見る。
 *
 * 一度配った住所は変えない。題名の表記がサイト側で直っても、住所は最初のまま残す。
 */
const worksDir = path.join(process.cwd(), "data", "works");
const catalogPath = path.join(process.cwd(), "data", "catalog.json");

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

/** data/works にある日付。古い順に畳む */
async function dateKeys(): Promise<DateKey[]> {
  try {
    const names = await fs.readdir(worksDir);

    return names
      .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
      .map((name) => name.slice(0, 10))
      .sort();
  } catch {
    return [];
  }
}

/** 曜日は必ず日本時間で読む。動いている環境の時間帯で読むと1日ずれる */
function weekdayIndexOf(date: DateKey): number {
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    weekday: "short",
  })
    .format(new Date(`${date}T00:00:00+09:00`))
    .toLowerCase();

  return weekdays.indexOf(short as (typeof weekdays)[number]);
}

/** まだ誰も使っていない住所にする。落とした字のぶんだけ重なることがある */
function freeSlug(title: string, taken: Set<string>): string {
  const base = workSlug(title);

  if (!taken.has(base)) {
    return base;
  }

  for (let suffix = 2; ; suffix += 1) {
    const slug = `${base}-${suffix}`;

    if (!taken.has(slug)) {
      return slug;
    }
  }
}

export default async function buildCatalog(): Promise<void> {
  const previous = await readJson<CatalogEntry[]>(catalogPath, []);
  const byKey = new Map(
    previous.map((entry) => [titleKey(entry.title), entry] as const),
  );
  const taken = new Set(previous.map((entry) => entry.slug));
  const dates = await dateKeys();

  for (const date of dates) {
    const works = await readJson<Work[]>(
      path.join(worksDir, `${date}.json`),
      [],
    );
    const bit = 1 << weekdayIndexOf(date);

    works.forEach((work) => {
      const key = titleKey(work.title);
      const found = byKey.get(key);
      const site = {
        name: work.siteName,
        siteUrl: work.siteUrl,
        url: work.workUrl ?? work.url,
      };

      if (found === undefined) {
        const slug = freeSlug(work.title, taken);

        taken.add(slug);
        byKey.set(key, {
          dayBits: bit,
          firstSeen: date,
          lastSeen: date,
          sites: [site],
          slug,
          thumbnailUrl: work.thumbnailUrl,
          title: work.title,
        });

        return;
      }

      const sites = found.sites.filter(
        (entry) => entry.siteUrl !== site.siteUrl,
      );

      // 住所は変えない。題名と絵は新しい方を採る
      byKey.set(key, {
        ...found,
        dayBits: found.dayBits | bit,
        firstSeen: date < found.firstSeen ? date : found.firstSeen,
        lastSeen: date > found.lastSeen ? date : found.lastSeen,
        sites: [...sites, site],
        thumbnailUrl: work.thumbnailUrl ?? found.thumbnailUrl,
        title: work.title,
      });
    });
  }

  const entries = [...byKey.values()].toSorted((a, b) =>
    a.title.localeCompare(b.title, "ja"),
  );

  await fs.writeFile(catalogPath, `${JSON.stringify(entries, null, 2)}\n`);

  console.log(
    `[catalog] ${entries.length}件（新しく ${entries.length - previous.length}件）`,
  );
}

if (process.argv[1]?.endsWith(path.join("catalog", "index.ts")) === true) {
  await buildCatalog();
}
