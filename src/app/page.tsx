import { type Metadata } from "next";
import { type DayKey, weekdays } from "@/types/work";
import App from "./_components/App";
import { dayLabel } from "./days";
import groupsOfDay from "./groupsOfDay";

/** 日付が変わったら当日の曜日になるよう、1時間ごとに作り直す */
export const revalidate = 3600;

function todayInJapan(): DayKey {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    weekday: "short",
  }).format(new Date());
  const day = weekdays.find((weekday) => weekday === formatted.toLowerCase());

  return day ?? "sun";
}

export function generateMetadata(): Metadata {
  return {
    description: `${dayLabel(todayInJapan())}に更新されるWeb漫画の一覧です。`,
  };
}

export default function Page(): React.JSX.Element {
  const day = todayInJapan();

  return <App day={day} groups={groupsOfDay(day)} />;
}
