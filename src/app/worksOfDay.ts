import fs from "fs";
import path from "path";
import {
  type DateKey,
  type Weekday,
  weekdayJa,
  weekdays,
  type Work,
} from "@/types/work";

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

/**
 * その曜日に出す作品。あとで見つかったものほど上に置く。
 * 同じ回に見つかったものは作品名の順に並べる。
 */
export default function worksOfDay(day: Weekday): Work[] {
  return worksOfDate(recentDateOf(day)).toSorted((a, b) => {
    const diff = b.foundAt.localeCompare(a.foundAt);

    return diff === 0 ? a.title.localeCompare(b.title, "ja") : diff;
  });
}

/**
 * 「2026-08-17」を「8/17（月）」にする。
 * 曜日は必ず日本時間で読む。getDay は動いている環境の時間帯で答えるため、
 * Vercel のような UTC の環境では1日ずれる。
 */
export function dateLabel(date: DateKey): string {
  const [, month, day] = date.split("-");
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    weekday: "short",
  })
    .format(new Date(`${date}T00:00:00+09:00`))
    .toLowerCase() as Weekday;

  return `${Number(month)}/${Number(day)}（${weekdayJa[weekday]}）`;
}

/** 直近7日ぶん。新しい日から並べる */
export function recentWorks(from = new Date()): {
  date: DateKey;
  works: Work[];
}[] {
  return Array.from({ length: 7 }, (_, back) => {
    const date = dateKeyOf(new Date(from.getTime() - back * dayMs));

    return {
      date,
      works: worksOfDate(date).toSorted((a, b) => {
        const diff = b.foundAt.localeCompare(a.foundAt);

        return diff === 0 ? a.title.localeCompare(b.title, "ja") : diff;
      }),
    };
  });
}

export const dayKeys: Weekday[] = [...weekdays];
