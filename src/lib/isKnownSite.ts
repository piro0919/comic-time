import sitesJson from "@/data/sites.json";
import { type SiteEntry } from "@/types/work";

/**
 * 台帳（src/data/sites.json）に載っているサイトか。
 * /api/episodes と /go が受け取る住所を絞るのと同じ台帳で、フォローと先読みの設定も絞る。
 * 載っていないサイトを貯めても、一覧にも設定にも出ない行が増えるだけ。
 */
let known: Set<string> | undefined = undefined;

export default function isKnownSite(siteUrl: string): boolean {
  known ??= new Set((sitesJson as SiteEntry[]).map((site) => site.url));

  return known.has(siteUrl);
}
