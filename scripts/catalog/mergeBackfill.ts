import { type CatalogEntry, type DateKey } from "../../src/types/work.ts";

/**
 * 台帳の1件に、git の履歴から書き起こした更新の日を足す（scripts/catalog/backfillUpdates.ts）。
 *
 * - updates は台帳にある日と足す日を合わせ、重複を除いて古い順にする
 * - 台帳は 8/24 から貯めていて、履歴はそれより前まである。初めて見た日も履歴の最初に揃える
 * - 最後の更新日も履歴の最後に揃える。同じ回が載り続けた日まで lastSeen が進んでいると、
 *   作品ページの「最後の更新」と「更新を見つけた日」が食い違う（tests/catalogUpdates.test.ts）。
 *   流すと lastSeen が前へ戻ることがあり、サイトマップの lastmod と構造化データの dateModified も動く
 * - 更新を見た曜日（dayBits）は画面の文言に出るので触らない
 */
export default function mergeBackfill(
  entry: CatalogEntry,
  found: DateKey[],
): CatalogEntry {
  const sorted = [...new Set<DateKey>([...entry.updates, ...found])].sort();
  const first = sorted[0];

  return {
    ...entry,
    firstSeen:
      first !== undefined && first < entry.firstSeen ? first : entry.firstSeen,
    lastSeen: sorted.at(-1) ?? entry.lastSeen,
    updates: sorted,
  };
}
