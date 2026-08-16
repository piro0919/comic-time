import { type ParsedWork } from "../../../src/types/work.ts";
import gigaViewerAtom from "./gigaViewerAtom.ts";

/**
 * webアクションはトップに日付が出ず、期間でまとめた更新一覧しか持たない。
 * 日付の分かる Atom フィードから取る。
 */
const origin = "https://comic-action.com/";

export default async function comicAction(): Promise<ParsedWork[]> {
  return gigaViewerAtom(origin);
}
