import { type Metadata } from "next";
import { type Weekday, weekdays } from "@/types/work";
import App from "./_components/App";
import { dayLabel } from "./days";
import worksOfDay from "./worksOfDay";

/** 日付が変わったら当日の曜日になるよう、1時間ごとに作り直す */
export const revalidate = 3600;

function todayInJapan(): Weekday {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    weekday: "short",
  }).format(new Date());
  const day = weekdays.find((weekday) => weekday === formatted.toLowerCase());

  return day ?? "sun";
}

export function generateMetadata(): Metadata {
  return {
    description: `${dayLabel(todayInJapan())}に更新されたWeb漫画の一覧です。`,
  };
}

export default function Page(): React.JSX.Element {
  const day = todayInJapan();

  return <App day={day} works={worksOfDay(day)} />;
}
