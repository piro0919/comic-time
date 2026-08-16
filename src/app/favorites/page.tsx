import { type Metadata } from "next";
import Favorites from "../_components/Favorites";
import { dateLabel, recentWorks } from "../worksOfDay";

export const metadata: Metadata = {
  description: "登録した作品のうち、この一週間で更新されたものをまとめます。",
  title: "お気に入り",
};

/** 日付が変わったら並びも変わるよう、1時間ごとに作り直す */
export const revalidate = 3600;

export default function Page(): React.JSX.Element {
  const days = recentWorks().map((day) => ({
    label: dateLabel(day.date),
    works: day.works,
  }));

  return <Favorites days={days} />;
}
