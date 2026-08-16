import { type DateKey } from "../../src/types/work.ts";

/** 画面に出す日数。これより古い日のファイルは消す */
export const keepDays = 7;

const dayMs = 24 * 60 * 60 * 1000;

/** 日本時間の暦日を "2026-08-17" の形で返す */
export function dateKeyOf(date: Date): DateKey {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Tokyo",
    year: "numeric",
  }).format(date);
}

export function todayKey(): DateKey {
  return dateKeyOf(new Date());
}

/** 今日から遡って keepDays 日ぶんの日付。新しい順 */
export function recentKeys(today: DateKey = todayKey()): DateKey[] {
  const base = new Date(`${today}T00:00:00+09:00`).getTime();

  return Array.from({ length: keepDays }, (_, index) =>
    dateKeyOf(new Date(base - index * dayMs)),
  );
}

/**
 * 「8月17日」のような年の無い表記を日付に直す。
 * 年をまたいだ直後に未来の日付にならないよう、今日より後なら前年として扱う。
 */
export function resolveMonthDay(
  month: number,
  day: number,
  today: DateKey = todayKey(),
): DateKey {
  const year = Number(today.slice(0, 4));
  const pad = (value: number): string => String(value).padStart(2, "0");
  const candidate = `${year}-${pad(month)}-${pad(day)}`;

  return candidate <= today
    ? candidate
    : `${year - 1}-${pad(month)}-${pad(day)}`;
}

/** テキストの中から最初に見つかった月日を取り出す */
export function findMonthDay(
  text: string,
  today: DateKey = todayKey(),
): null | DateKey {
  const normalized = text.replace(/\s+/g, "");
  // 「2026 No.38 8月17日」のような並びで年を拾い違えないよう、
  // 年つきの表記は区切りが揃っているものだけを認める
  const withYear =
    /(\d{4})[-/](\d{1,2})[-/](\d{1,2})|(\d{4})年(\d{1,2})月(\d{1,2})日/.exec(
      normalized,
    );

  if (withYear !== null) {
    const [year, month, day] =
      withYear[1] === undefined
        ? [withYear[4], withYear[5], withYear[6]]
        : [withYear[1], withYear[2], withYear[3]];

    return `${year}-${month?.padStart(2, "0")}-${day?.padStart(2, "0")}`;
  }

  const monthDay =
    /(\d{1,2})月(\d{1,2})日/.exec(normalized) ??
    /(?<!\d)(\d{1,2})[-/.](\d{1,2})(?!\d)/.exec(normalized);

  if (monthDay === null) {
    return null;
  }

  // 「2026 No.38 8月17日」のように直前の数字を巻き込んだときは下一桁を取る
  const trim = (value: number, max: number): number =>
    value > max ? value % 10 : value;
  const month = trim(Number(monthDay[1]), 12);
  const day = trim(Number(monthDay[2]), 31);

  if (month < 1 || day < 1) {
    return null;
  }

  return resolveMonthDay(month, day, today);
}
