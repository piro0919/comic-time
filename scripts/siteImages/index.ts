import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import siteSlug from "../../src/app/siteSlug.ts";
import { type SiteEntry } from "../../src/types/work.ts";
import fetchHtml from "../scrape/fetchHtml.ts";

/**
 * 各サイトの OGP 画像を集めて、縮めた控えを public/site-covers に置く。
 * 看板の絵はめったに変わらないので、作品の取得とは分けて手で走らせる。
 *
 * 元の絵は 1200x630 の PNG で、重いものは1枚1.4MB ある。画面では 180px
 * ほどでしか出さないのに、25枚で 10MB を超えていた。配信元は各社の CDN で
 * こちらから縮められないため、縮めたものを持つ。
 *
 * 取れなかったサイトは前の回の控えをそのまま残す。
 * 一度取れたものを、その日たまたま落ちていただけで消したくない。
 */
const filePath = path.join(process.cwd(), "data", "siteImages.json");
const coverDir = path.join(process.cwd(), "public", "site-covers");
/** 画面に出す幅の2倍。細かい画面でも粗く見えない */
const coverWidth = 360;

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

/** 絵を取ってきて縮め、public/site-covers に webp で置く */
async function saveCover(imageUrl: string, slug: string): Promise<void> {
  const res = await fetch(imageUrl, {
    headers: {
      "User-Agent": "ComicTimeBot/1.0 (+https://comictime.kkweb.io/)",
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  const resized = await sharp(Buffer.from(await res.arrayBuffer()))
    .resize({ width: coverWidth, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  await fs.mkdir(coverDir, { recursive: true });
  await fs.writeFile(path.join(coverDir, `${slug}.webp`), resized);
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

      await saveCover(image, siteSlug(site.url));

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
