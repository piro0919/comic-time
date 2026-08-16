import { type ParsedWork } from "../../../src/types/work.ts";
import comici from "./comici.ts";

/** viewer.heros-web.com は heros-web.com へ飛ぶので、一覧は飛び先から取る */
const origin = "https://heros-web.com/";

export default async function comiplex(): Promise<ParsedWork[]> {
  return comici(origin);
}
