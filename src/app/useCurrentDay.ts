import dayjs from "dayjs";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export const days = [
  { en: "sun", ja: "日" },
  { en: "mon", ja: "月" },
  { en: "tue", ja: "火" },
  { en: "wed", ja: "水" },
  { en: "thu", ja: "木" },
  { en: "fri", ja: "金" },
  { en: "sat", ja: "土" },
] as const;

export type CurrentDay =
  | {
      en: "irregular" | (typeof days)[number]["en"];
      index: number;
      ja: "不定期" | (typeof days)[number]["ja"];
    }
  | undefined;

export default function useCurrentDay(): CurrentDay {
  const searchParams = useSearchParams();
  const day = searchParams.get("day");
  const [todayDay, setTodayDay] = useState<null | number>(null);
  const currentDay = useMemo(() => {
    if (typeof day === "string") {
      if (day === "irregular") {
        return {
          en: "irregular",
          index: 8,
          ja: "不定期",
        } as const;
      }

      const dayIndex = days.findIndex((d) => d.en === day);
      const en = days.at(dayIndex)?.en;
      const ja = days.at(dayIndex)?.ja;

      return dayIndex >= 0 && typeof en === "string" && typeof ja === "string"
        ? {
            en,
            index: dayIndex,
            ja,
          }
        : undefined;
    }

    if (typeof todayDay === "number") {
      const en = days.at(todayDay)?.en;
      const ja = days.at(todayDay)?.ja;

      return typeof en === "string" && typeof ja === "string"
        ? {
            en,
            index: todayDay,
            ja,
          }
        : undefined;
    }

    return undefined;
  }, [day, todayDay]);

  useEffect(() => {
    setTodayDay(dayjs().day());
  }, []);

  return currentDay;
}
