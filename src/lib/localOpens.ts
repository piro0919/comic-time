import fs from "fs";
import path from "path";

/**
 * 手元で動かしているときだけ使う、クリックの控え。
 *
 * Vercel Web Analytics は開発中のイベントを受け取らない。debug の表示が
 * 出るだけで、どこにも記録されない。それだとランキングが動くところを
 * 手元で見られないので、開発時に限って同じ数をここに貯める。
 *
 * 本番では読み書きしない。npm run dev のときだけ通る道。
 */
const filePath = path.join(process.cwd(), "data", "localOpens.json");

export const isLocal = process.env.NODE_ENV === "development";

/** 題名ごとの回数。書き込んだ順は見ない */
export type LocalOpens = Record<string, number>;

export function readLocalOpens(): LocalOpens {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as LocalOpens;
  } catch {
    return {};
  }
}

/** 1回ぶん足す。書けなくても黙って諦める。確認用の控えでしかない */
export function addLocalOpen(title: string): void {
  const opens = readLocalOpens();

  opens[title] = (opens[title] ?? 0) + 1;

  try {
    fs.writeFileSync(filePath, `${JSON.stringify(opens, null, 2)}\n`);
  } catch {
    return;
  }
}
