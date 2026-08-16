import { type ParsedWork } from "../../../src/types/work.ts";
import gigaViewerAtom from "./gigaViewerAtom.ts";

/** COMIC OGYAAA!! は金曜の更新。日付は Atom フィードから取る */
const origin = "https://comic-ogyaaa.com/";

export default async function comicOgyaaa(): Promise<ParsedWork[]> {
  return gigaViewerAtom(origin);
}
