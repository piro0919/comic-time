import { type ParsedWork } from "../../../src/types/work.ts";
import comici from "./comici.ts";

const origin = "https://comicride.jp/";

export default async function comicRide(): Promise<ParsedWork[]> {
  return comici(origin);
}
