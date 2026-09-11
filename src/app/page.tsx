import { type Metadata } from "next";
import { type Weekday, weekdays } from "@/types/work";
import Home from "./_components/Home";
import WorkIndex from "./_components/WorkIndex";
import crossSiteWorks from "./crossSiteWorks";
import { dayLabel } from "./days";
import pageMetadata from "./pageMetadata";
import { worksOfWeekday } from "./workCatalog";
import worksOfDay, { dateLabel, recentDateOf, recentWorks } from "./worksOfDay";

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
    description:
      "今日更新された Web 漫画の一覧です。お気に入りに登録した作品があるときは、その更新をまとめて表示します。",
    path: "/",
  });
}

export default function Page(): React.JSX.Element {
  const today = todayInJapan();
  const days = recentWorks().map((day) => ({
    date: day.date,
    label: dateLabel(day.date),
    works: day.works,
  }));

  return (
    <>
      <Home
        crossSites={crossSiteWorks()}
        date={recentDateOf(today)}
        days={days}
        today={today}
        todayWorks={worksOfDay(today)}
      />
      <WorkIndex
        heading={`${dayLabel(today)}に更新される作品`}
        works={worksOfWeekday(today)}
      />
    </>
  );
}
