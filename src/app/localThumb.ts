import fs from "fs";
import path from "path";
import thumbKey from "./thumbKey";

/**
 * 縮めた控えがあれば、そちらの住所を返す。無ければ元のまま。
 *
 * 控えを作っているのは scripts/workThumbs。取れなかった絵は一覧に載らないので、
 * ここは黙って元の住所を返す。絵が消えるより、その1枚が重いほうがいい。
 */
const listPath = path.join(process.cwd(), "data", "workThumbs.json");

let loaded: Set<string> | undefined = undefined;

function keys(): Set<string> {
  if (loaded === undefined) {
    try {
      loaded = new Set(
        JSON.parse(fs.readFileSync(listPath, "utf-8")) as string[],
      );
    } catch {
      loaded = new Set();
    }
  }

  return loaded;
}

export default function localThumb(url: null | string): null | string {
  if (url === null) {
    return null;
  }

  const key = thumbKey(url);

  return keys().has(key) ? `/work-thumbs/${key}.webp` : url;
}
