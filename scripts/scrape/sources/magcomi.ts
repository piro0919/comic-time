import { type ParsedWork } from "../../../src/types/work.ts";
import todayKey from "../date.ts";
import gigaViewerAtom from "./gigaViewerAtom.ts";

/**
 * マグコミは火曜と金曜の更新。日付は Atom フィードから取る。
 * フィードには作品でないものも流れるが、作りの上では作品と区別が付かないため、
 * 名前を書いて外している。混ざるたびにここへ足す。
 */
const origin = "https://magcomi.com/";
const excluded = ["1ページ漫画賞「箱庭」"];

export default async function magcomi(
  date = todayKey(),
): Promise<ParsedWork[]> {
  const works = await gigaViewerAtom(origin, date);

  return works.filter((work) => !excluded.includes(work.title));
}
