import { type Metadata } from "next";
import { cookies } from "next/headers";
import { type Weekday, weekdays } from "@/types/work";
import Home from "./_components/Home";
import WorkIndex from "./_components/WorkIndex";
import crossSiteWorks from "./crossSiteWorks";
import { dayLabel } from "./days";
import { favoritesCookie } from "./favoritesCookie";
import pageMetadata from "./pageMetadata";
import { worksOfWeekday } from "./workCatalog";
import worksOfDay, { dateLabel, recentDateOf, recentWorks } from "./worksOfDay";

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

/**
 * クッキーを読むので、この画面だけは毎回サーバーで描く。静的な作り置きはできない。
 * 描くのに60msほどかかるが、そのぶん開いた瞬間から正しい方が出る。
 * 登録がある人に今日の一覧を1.2秒見せていたのを、ここで畳んでいる。
 */
export default async function Page(): Promise<React.JSX.Element> {
  const today = todayInJapan();
  // 中身は "1" だけ。何を登録しているかは載っていない
  const hasFavorites = (await cookies()).get(favoritesCookie)?.value === "1";
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
        hasFavorites={hasFavorites}
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
