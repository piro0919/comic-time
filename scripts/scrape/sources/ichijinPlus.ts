import { type ParsedWork } from "../../../src/types/work.ts";
import todayKey from "../date.ts";
import gigaViewerAtom from "./gigaViewerAtom.ts";

/**
 * 一迅プラスはトップの更新欄が10件で切れる。日付の分かる Atom フィードから取る。
 *
 * フィードも20件で切れるが、一番多い金曜でも13件（2026-11-13）なので、
 * その日のぶんは収まっている。更新はどの回も日本時間の11時。
 */
const origin = "https://ichicomi.com/";

export default async function ichijinPlus(
  date = todayKey(),
): Promise<ParsedWork[]> {
  return gigaViewerAtom(origin, date);
}
