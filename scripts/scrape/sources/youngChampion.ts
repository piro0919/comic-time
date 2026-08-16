import { type ParsedWork } from "../../../src/types/work.ts";
import comici from "./comici.ts";

const origin = "https://youngchampion.jp/";

export default async function youngChampion(): Promise<ParsedWork[]> {
  return comici(origin);
}
