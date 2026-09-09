import { type Work } from "../../src/types/work.ts";

/**
 * 更新日をどこにも出さないサイトのために、話数が動いたかどうかで更新を見る。
 *
 * 一覧に話への道が無いサイトは、作品ページのバックナンバーの先頭を最新話として
 * 拾っている（resolveEpisodes）。この拾い方だと、連載が終わった作品にサイトが
 * 完結の印を付けない限り、同じ話を毎日「今日の更新」として出し続けてしまう。
 *
 * そこで、前の日までに同じ話を出していたものは今日の更新ではないとみなす。
 * 対象は workUrl を持つ作品だけ——こちらで作品ページから最新話を割り出したもの——に
 * 限る。一覧が話の住所をそのまま配っているサイトや、作品ページ止まりのサイトは
 * 触らない。
 */
export default function dropRepeats(
  works: Work[],
  seenBefore: ReadonlySet<string>,
): Work[] {
  return works.filter(
    (work) => work.workUrl === undefined || !seenBefore.has(work.url),
  );
}
