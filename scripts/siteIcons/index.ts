import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import siteSlug from "../../src/app/siteSlug.ts";
import { type SiteEntry } from "../../src/types/work.ts";
import fetchHtml from "../scrape/fetchHtml.ts";

/**
 * 各サイトのファビコンを集めて、public/site-icons に置く。
 * 同じ作品が複数サイトに載っているとき、カードの上にこれを並べて
 * どこで読めるかを見せる。看板の絵と同じくめったに変わらないので、
 * 作品の取得とは分けて手で走らせる。
 */
const filePath = path.join(process.cwd(), "data", "siteIcons.json");
const iconDir = path.join(process.cwd(), "public", "site-icons");
/** 画面に出す大きさの3倍ほど。小さい印なので、これで足りる */
const iconWidth = 64;

type Candidate = {
  size: number;
  url: string;
};

/**
 * head の中の icon 系リンク。大きいものを先に返す。
 * ico は最後の手段にする。中身が形式の寄せ集めで、扱いが重いため。
 */
function iconsOf(html: string, base: string): Candidate[] {
  const tags = html.match(/<link[^>]+>/gi) ?? [];
  const found: Candidate[] = [];

  for (const tag of tags) {
    const rel = /rel=["']([^"']+)["']/i.exec(tag)?.[1] ?? "";

    if (!/icon/i.test(rel)) {
      continue;
    }

    const href = /href=["']([^"']+)["']/i.exec(tag)?.[1];

    if (href === undefined || href === "") {
      continue;
    }

    const declared = /sizes=["'](\d+)x\d+["']/i.exec(tag)?.[1];
    // 大きさの申告が無いとき、apple-touch-icon は 180 相当で作られている
    const size =
      declared === undefined
        ? /apple-touch-icon/i.test(rel)
          ? 180
          : 32
        : Number(declared);

    try {
      found.push({ size, url: new URL(href, base).toString() });
    } catch {
      continue;
    }
  }

  return found.toSorted((a, b) => {
    const aIco = /\.ico(?:\?|$)/i.test(a.url) ? 1 : 0;
    const bIco = /\.ico(?:\?|$)/i.test(b.url) ? 1 : 0;

    return aIco === bIco ? b.size - a.size : aIco - bIco;
  });
}

/**
 * ico から一番大きい絵を取り出す。
 * 中身が PNG の入れ物になっているものだけを扱う。
 * 昔ながらの BMP のものは sharp が読めないので、諦めて次の候補へ回す。
 */
function pngInIco(buffer: Buffer): Buffer {
  const count = buffer.readUInt16LE(4);

  let best: Buffer | undefined;
  let bestArea = 0;

  for (let index = 0; index < count; index += 1) {
    const entry = 6 + index * 16;
    const width = buffer[entry] === 0 ? 256 : buffer[entry];
    const height = buffer[entry + 1] === 0 ? 256 : buffer[entry + 1];
    const length = buffer.readUInt32LE(entry + 8);
    const offset = buffer.readUInt32LE(entry + 12);
    const data = buffer.subarray(offset, offset + length);
    const isPng = data
      .subarray(0, 8)
      .equals(Buffer.from("89504e470d0a1a0a", "hex"));

    if (isPng && width * height > bestArea) {
      best = data;
      bestArea = width * height;
    }
  }

  if (best === undefined) {
    throw new Error("ico の中に PNG が無い");
  }

  return best;
}

/** 絵を取ってきて縮め、public/site-icons に png で置く */
async function saveIcon(iconUrl: string, slug: string): Promise<void> {
  const res = await fetch(iconUrl, {
    headers: {
      "User-Agent": "ComicTimeBot/1.0 (+https://comictime.kkweb.io/)",
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  const raw = Buffer.from(await res.arrayBuffer());
  const source = /\.ico(?:\?|$)/i.test(iconUrl) ? pngInIco(raw) : raw;
  const resized = await sharp(source)
    .resize({ height: iconWidth, width: iconWidth })
    .png()
    .toBuffer();

  await fs.mkdir(iconDir, { recursive: true });
  await fs.writeFile(path.join(iconDir, `${slug}.png`), resized);
}

async function readJson<T>(fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

export default async function siteIcons(): Promise<void> {
  const sites = JSON.parse(
    await fs.readFile(
      path.join(process.cwd(), "src", "data", "sites.json"),
      "utf-8",
    ),
  ) as SiteEntry[];
  const previous = await readJson<Record<string, string>>({});
  const collected: Record<string, string> = {};
  const failed: string[] = [];

  console.log(`[siteIcons] 対象 ${sites.length} サイト`);

  for (const site of sites) {
    const candidates = iconsOf(await fetchHtml(site.url), site.url);

    let saved: null | string = null;

    // 大きいものから当てて、読めたところで止める
    for (const candidate of candidates) {
      try {
        await saveIcon(candidate.url, siteSlug(site.url));

        saved = candidate.url;

        break;
      } catch {
        continue;
      }
    }

    if (saved === null) {
      const kept = previous[site.url];

      if (kept !== undefined) {
        collected[site.url] = kept;
      }

      console.error(`[siteIcons] ${site.name}: 失敗`);
      failed.push(site.name);

      continue;
    }

    collected[site.url] = saved;
    console.log(`[siteIcons] ${site.name}: ${saved}`);
  }

  // 台帳から消えたサイトのぶんは残さない
  const sorted = Object.fromEntries(
    Object.entries(collected).toSorted(([a], [b]) => a.localeCompare(b)),
  );

  await fs.writeFile(filePath, `${JSON.stringify(sorted, null, 2)}\n`);

  console.log(
    `[siteIcons] 完了 ${Object.keys(sorted).length} 件${
      failed.length === 0 ? "" : `／失敗 ${failed.join("、")}`
    }`,
  );
}

await siteIcons();
