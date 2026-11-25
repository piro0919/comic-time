import { type CatalogEntry } from "@/types/work";

/**
 * 作品ページを検索に出すのに要る、更新を見つけた回数。
 *
 * 2026-10-08 から作品ページが検索に出なくなった。本文のうち作品固有のものは
 * 掲載サイト名・最後の更新日・更新曜日・話の題名だけで、他所の更新を並べ直しただけの
 * ページと見られた可能性がある。このサイトにしか無いのは毎日見に行って記録した事実なので、
 * それが薄いページは検索に出さない。スパムポリシーの Scraping の項にも
 * "If you're hosting such content on your site, exclude it from Search." とある。
 *
 * 3回なのは、隔週・月1・休載を判定するのに更新の間隔が2つ要るため。
 * 新しい作品も3回目の更新を見つけた時点で検索に出る。
 *
 * サイトマップ（next-sitemap.config.js）も同じ数で外している。変えるときは両方直す。
 * 食い違えば tests/isIndexed.test.ts が落ちる。
 */
export const minUpdatesToIndex = 3;

/** 同じ日は1回と数える。間隔の判定（updateRhythm）と数を揃え、判定の出ないページを検索に出さない */
export default function isIndexed(entry: CatalogEntry): boolean {
  return new Set(entry.updates).size >= minUpdatesToIndex;
}
