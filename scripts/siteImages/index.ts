import fs from "fs/promises";
import path from "path";
import { type SiteEntry } from "../../src/types/work.ts";
import fetchHtml from "../scrape/fetchHtml.ts";

/**
 * 各サイトの OGP 画像の場所を集めて data/siteImages.json に書く。
 * 看板の絵はめったに変わらないので、作品の取得とは分けて手で走らせる。
 *
 * 取れなかったサイトは前の回の値をそのまま残す。
 * 一度取れたものを、その日たまたま落ちていただけで消したくない。
 */
const filePath = path.join(process.cwd(), "data", "siteImages.json");

/** そのページの og:image。相対で書かれていることがあるので絶対にして返す */
function ogImageOf(html: string, base: string): null | string {
  const tags = html.match(/<meta[^>]+>/gi) ?? [];

  for (const tag of tags) {
    if (!/(?:property|name)=["']og:image["']/i.test(tag)) {
      continue;
    }

    const content = /content=["']([^"']+)["']/i.exec(tag)?.[1];

    if (content === undefined || content === "") {
      continue;
    }

    try {
      return new URL(content, base).toString();
    } catch {
      return null;
    }
  }

  return null;
}

async function readJson<T>(fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

export default async function siteImages(): Promise<void> {
  const sites = JSON.parse(
    await fs.readFile(
      path.join(process.cwd(), "src", "data", "sites.json"),
      "utf-8",
    ),
  ) as SiteEntry[];
  const previous = await readJson<Record<string, string>>({});
  const collected: Record<string, string> = {};
  const failed: string[] = [];

  console.log(`[siteImages] 対象 ${sites.length} サイト`);

  for (const site of sites) {
    try {
      const image = ogImageOf(await fetchHtml(site.url), site.url);

      if (image === null) {
        throw new Error("og:image が無い");
      }

      collected[site.url] = image;
      console.log(`[siteImages] ${site.name}: ${image}`);
    } catch (error) {
      const kept = previous[site.url];

      if (kept !== undefined) {
        collected[site.url] = kept;
      }

      console.error(`[siteImages] ${site.name}: 失敗`, error);
      failed.push(site.name);
    }
  }

  // 台帳から消えたサイトのぶんは残さない
  const sorted = Object.fromEntries(
    Object.entries(collected).toSorted(([a], [b]) => a.localeCompare(b)),
  );

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(sorted, null, 2)}\n`);

  console.log(`[siteImages] ${Object.keys(sorted).length}件を書き出し`);

  if (failed.length > 0) {
    console.error(`[siteImages] 取れなかったサイト: ${failed.join(", ")}`);
    process.exitCode = 1;
  }
}

await siteImages();
