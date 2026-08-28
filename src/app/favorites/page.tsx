import { type Metadata } from "next";
import Favorites from "../_components/Favorites";
import crossSiteWorks from "../crossSiteWorks";
import pageMetadata from "../pageMetadata";
import { dateLabel, recentWorks } from "../worksOfDay";

export const metadata: Metadata = pageMetadata({
  description:
    "お気に入りに追加した作品のうち、過去 7 日間に更新されたものを表示します。",
  path: "/favorites",
  title: "お気に入り",
});

/** 日付が変わったら並びも変わるよう、1時間ごとに作り直す */
export const revalidate = 3600;

export default function Page(): React.JSX.Element {
  const days = recentWorks().map((day) => ({
    date: day.date,
    label: dateLabel(day.date),
    works: day.works,
  }));

  return <Favorites crossSites={crossSiteWorks()} days={days} />;
}
