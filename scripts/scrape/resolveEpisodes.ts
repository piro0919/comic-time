import { type ParsedWork } from "../../src/types/work.ts";
import mapLimited from "./mapLimited.ts";

/**
 * 一覧に話への道が無いサイトのために、作品ページを見て最新話の住所に差し替える。
 *
 * 取得は日に4回走る。同じ日に一度調べた作品はその答えを使い回し、作品ページを
 * もう一度見に行かない。相手に頼む回数がおよそ4分の1になる。
 * 代わりに、同じ作品が同じ日に2回更新されたときは、その日のあいだ1回目の話を指す。
 */
const known = new Map<string, string>();

/** その日のぶんとして既に書き出してある作品を覚える。日をまたぐときは呼び直す */
export function remember(works: { url: string; workUrl?: string }[]): void {
  known.clear();

  works.forEach((work) => {
    if (work.workUrl !== undefined) {
      known.set(work.workUrl, work.url);
    }
  });
}

/** テスト用。覚えたものを捨てる */
export function forget(): void {
  known.clear();
}

export default async function resolveEpisodes(
  works: ParsedWork[],
  find: (workUrl: string) => Promise<null | string>,
): Promise<ParsedWork[]> {
  return mapLimited(works, async (work) => {
    const episode = known.get(work.url) ?? (await find(work.url));

    return episode === null || episode === undefined
      ? work
      : { ...work, url: episode, workUrl: work.url };
  });
}
