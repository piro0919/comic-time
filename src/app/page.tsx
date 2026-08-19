import { type Metadata } from "next";
import { type Weekday, weekdays } from "@/types/work";
import Home from "./_components/Home";
import pageMetadata from "./pageMetadata";
import { dateLabel, recentWorks } from "./worksOfDay";

/** 日付が変わったら中身も変わるよう、1時間ごとに作り直す */
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
  return pageMetadata({
    description: "登録した作品のうち、この一週間で更新されたものをまとめます。",
    path: "/",
  });
}

export default function Page(): React.JSX.Element {
  const days = recentWorks().map((day) => ({
    label: dateLabel(day.date),
    works: day.works,
  }));

  return <Home days={days} today={todayInJapan()} />;
}
