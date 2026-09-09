"use client";
import dayjs from "dayjs";
import { useMemo } from "react";
import { type Weekday, weekdayJa, weekdays } from "@/types/work";
import { days } from "./days";
import useIsHydrated from "./useIsHydrated";

export type DayMenuItem = {
  key: Weekday;
  label: string;
};

/**
 * 今日を先頭に、そこから遡って一週間ぶんの日付を並べる。
 * 端末の日付はサーバと食い違うため、描画後に日付つきへ差し替える。
 */
export default function useDayMenu(): DayMenuItem[] {
  const isHydrated = useIsHydrated();

  return useMemo(() => {
    if (!isHydrated) {
      return days.map(({ key, label }) => ({ key, label }));
    }

    const today = dayjs();

    return Array.from({ length: 7 }, (_, back): DayMenuItem => {
      const date = today.subtract(back, "day");
      const key = weekdays.at(date.day());

      return {
        key: key ?? "sun",
        label: `${date.month() + 1}/${date.date()}（${key === undefined ? "" : weekdayJa[key]}）`,
      };
    });
  }, [isHydrated]);
}
