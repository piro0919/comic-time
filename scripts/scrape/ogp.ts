import fs from "fs/promises";
import ogs from "open-graph-scraper";
import pLimit from "p-limit";
import path from "path";
import { type SiteEntry } from "../../src/types/work.ts";

/**
 * 作品一覧を取れないサイトは従来どおりサイト単位で出すため、
 * カードに使う画像だけ OGP から拾って持っておく。
 */
const outPath = path.join(process.cwd(), "data", "site-ogp.json");
const sites = JSON.parse(
  await fs.readFile(
    path.join(process.cwd(), "src", "data", "sites.json"),
    "utf-8",
  ),
) as SiteEntry[];
const limit = pLimit(5);
const entries = await Promise.all(
  sites.map(async (site) =>
    limit(async () => {
      try {
        const { result } = await ogs({ url: site.url });
        const image = result.ogImage?.[0]?.url;

        return [
          site.url,
          typeof image === "string"
            ? new URL(image, site.url).toString()
            : null,
        ] as const;
      } catch {
        console.warn(`[ogp] ${site.name}: 取得失敗`);

        return [site.url, null] as const;
      }
    }),
  ),
);

await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(
  outPath,
  `${JSON.stringify(Object.fromEntries(entries), null, 2)}\n`,
);

console.log(
  `[ogp] ${entries.filter(([, image]) => image !== null).length}/${entries.length} 件取得`,
);
