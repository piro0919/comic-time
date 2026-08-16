import { type ParsedWork } from "../../../src/types/work.ts";
import comici from "./comici.ts";

const origin = "https://championcross.jp/";

export default async function championCross(): Promise<ParsedWork[]> {
  return comici(origin);
}
