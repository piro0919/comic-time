import { type ParsedWork } from "../../../src/types/work.ts";
import todayKey from "../date.ts";
import gigaViewerAtom from "./gigaViewerAtom.ts";

/**
 * コミックガルドはトップに日付が出ない。日付の分かる Atom フィードから取る。
 *
 * 誌としては「金曜12時更新」を掲げているが、フィードを数えると毎日12時に出ている。
 * 台帳の更新日も実測に合わせてある。
 */
const origin = "https://comic-gardo.com/";

export default async function comicGardo(
  date = todayKey(),
): Promise<ParsedWork[]> {
  return gigaViewerAtom(origin, date);
}
