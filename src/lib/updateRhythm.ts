import { type DateKey } from "@/types/work";

/**
 * 更新を見つけた日（台帳の updates）から、更新の間隔を判定する。
 *
 * 間隔の中央値で分ける。2026-11-26 に更新3回以上の 3,906件を数えると、
 * 6〜8日が 1,189件、13〜15日が 1,271件、26〜35日が 869件で、残りの 577件は
 * 週2回・3週おき・ばらばらのどれかだった。
 *
 * 判定には間隔が2つ要るので、更新が3回に満たない作品は判定しない。
 * 作品ページを検索に出す線（isIndexed）も同じ理由で3回にしている。
 */
type Rhythm = "不定期" | "月1" | "週1" | "週2回以上" | "隔週";

export type UpdateRhythm = {
  /** 最後の更新から、いつもの間隔の2.5倍を過ぎた。2日続けての更新は1回と数える */
  paused: boolean;
  rhythm: Rhythm;
};

const msPerDay = 86_400_000;
const minUpdates = 3;
/** 最後の更新からこの倍数の間隔が空いたら休載中とみなす */
const pausedRatio = 2.5;
/** [中央値の下限, 上限, 判定]。どれにも当たらなければ不定期 */
const bands: [number, number, Rhythm][] = [
  [0, 5, "週2回以上"],
  [6, 8, "週1"],
  [13, 15, "隔週"],
  [26, 35, "月1"],
];

function daysBetween(from: DateKey, to: DateKey): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00+09:00`) -
      Date.parse(`${from}T00:00:00+09:00`)) /
      msPerDay,
  );
}

/** 間隔の中央値。数が偶数なら大きい方を採る */
function medianOf(values: number[]): number {
  const sorted = values.toSorted((a, b) => a - b);

  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

export default function updateRhythm(
  updates: DateKey[],
  today: DateKey,
): null | UpdateRhythm {
  const last = updates.at(-1);

  if (updates.length < minUpdates || last === undefined) {
    return null;
  }

  const gaps = updates
    .slice(1)
    .map((date, index) => daysBetween(updates[index], date));
  const median = medianOf(gaps);
  const band = bands.find(([low, high]) => median >= low && median <= high);
  // 休載の線は、2日続けての更新を1回と数えて引く。木金に更新する作品は間隔が
  // 1日・6日・1日…と並び、中央値が1日になる。それで線を引くと決まった休みの間に休載中と出る
  const spaced = gaps.filter((gap) => gap > 1);
  const usual = spaced.length > 0 ? medianOf(spaced) : median;

  return {
    paused: daysBetween(last, today) > usual * pausedRatio,
    rhythm: band?.[2] ?? "不定期",
  };
}

/** 「11月」の見出しと、その月に更新を見つけた日。どちらも新しい順 */
export type MonthOfUpdates = {
  days: number[];
  label: string;
};

/** 月ごとに束ねる。年をまたぐ履歴だけ、見出しに年を付ける */
export function updatesByMonth(updates: DateKey[]): MonthOfUpdates[] {
  const months = new Map<string, number[]>();

  updates.toSorted().forEach((date) => {
    const month = date.slice(0, 7);

    months.set(month, [
      Number(date.slice(8, 10)),
      ...(months.get(month) ?? []),
    ]);
  });

  const keys = [...months.keys()].toReversed();
  const years = new Set(keys.map((key) => key.slice(0, 4)));

  return keys.map((key) => {
    const month = `${Number(key.slice(5, 7))}月`;

    return {
      days: months.get(key) ?? [],
      label: years.size > 1 ? `${key.slice(0, 4)}年${month}` : month,
    };
  });
}
