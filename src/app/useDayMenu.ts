"use client";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { type Weekday, weekdayJa, weekdays } from "@/types/work";
import { days } from "./days";

export type DayMenuItem = {
  key: Weekday;
  label: string;
};

/**
 * 今日を先頭に、そこから遡って一週間ぶんの日付を並べる。
 * 端末の日付はサーバと食い違うため、描画後に日付つきへ差し替える。
 */
export default function useDayMenu(): DayMenuItem[] {
  const [items, setItems] = useState<DayMenuItem[]>(() =>
    days.map(({ key, label }) => ({ key, label })),
  );

  useEffect(() => {
    const today = dayjs();
    const week = Array.from({ length: 7 }, (_, back): DayMenuItem => {
      const date = today.subtract(back, "day");
      const key = weekdays.at(date.day());

      return {
        key: key ?? "sun",
        label: `${date.month() + 1}/${date.date()}（${key === undefined ? "" : weekdayJa[key]}）`,
      };
    });

    setItems(week);
  }, []);

  return items;
}
