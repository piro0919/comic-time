import { type ParsedWork } from "../../../src/types/work.ts";
import comici from "./comici.ts";

const origin = "https://takecomic.jp/";

export default async function takeComic(): Promise<ParsedWork[]> {
  return comici(origin);
}
