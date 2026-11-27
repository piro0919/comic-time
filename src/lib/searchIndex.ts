import { catalog } from "@/lib/workCatalog";
import { type IndexedWork, type SearchIndex } from "@/types/work";

/**
 * 台帳の全作品から、検索用の一覧を組み立てる。
 *
 * data/works の7日ぶんから作ると、隔週や月1の作品が更新の無い週に見つからない。
 * お気に入りはサイトごとなので、複数のサイトに載る作品はサイトの数だけ並べる。
 */
export default function searchIndex(): SearchIndex {
  const siteNames: string[] = [];
  const siteUrls: string[] = [];
  const works: IndexedWork[] = [];

  catalog().forEach((entry) => {
    entry.sites.forEach((site) => {
      if (!siteUrls.includes(site.siteUrl)) {
        siteNames.push(site.name);
        siteUrls.push(site.siteUrl);
      }

      works.push([
        entry.title,
        site.url,
        siteUrls.indexOf(site.siteUrl),
        entry.dayBits,
      ]);
    });
  });

  return {
    siteNames,
    siteUrls,
    works: works.toSorted((a, b) => a[0].localeCompare(b[0], "ja")),
  };
}
