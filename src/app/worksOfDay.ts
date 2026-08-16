import fs from "fs";
import path from "path";
import { type DateKey, type Weekday, weekdays, type Work } from "@/types/work";

const dataDir = path.join(process.cwd(), "data", "works");
const dayMs = 24 * 60 * 60 * 1000;

function dateKeyOf(date: Date): DateKey {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Tokyo",
    year: "numeric",
  }).format(date);
}

/** 曜日ごとに、直近のその曜日の日付を返す。今日はその曜日ぶんとして扱う */
export function recentDateOf(day: Weekday, from = new Date()): DateKey {
  const target = weekdays.indexOf(day);

  for (let back = 0; back < 7; back += 1) {
    const date = new Date(from.getTime() - back * dayMs);
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo",
      weekday: "short",
    })
      .format(date)
      .toLowerCase();

    if (weekdays.indexOf(weekday as Weekday) === target) {
      return dateKeyOf(date);
    }
  }

  return dateKeyOf(from);
}

/** その日に更新された作品。ファイルが無ければ空 */
export function worksOfDate(date: DateKey): Work[] {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(dataDir, `${date}.json`), "utf-8"),
    ) as Work[];
  } catch {
    return [];
  }
}

/** その曜日に出す作品。作品名の順に並べる */
export default function worksOfDay(day: Weekday): Work[] {
  return worksOfDate(recentDateOf(day)).toSorted((a, b) =>
    a.title.localeCompare(b.title, "ja"),
  );
}

export const dayKeys: Weekday[] = [...weekdays];
