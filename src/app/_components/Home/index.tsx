"use client";
import useFavorites from "@/app/useFavorites";
import { type DateKey, type Weekday, type Work } from "@/types/work";
import App from "../App";
import Favorites, { type FavoritesProps } from "../Favorites";

export type HomeProps = {
  crossSites: FavoritesProps["crossSites"];
  /** 今日ぶんとして出している日。既読の判断に使う */
  date: DateKey;
  days: FavoritesProps["days"];
  today: Weekday;
  todayWorks: Work[];
};

/**
 * 追いかける作品を登録している人には、その更新をまとめて見せる。
 * 何も登録していない人には今日の一覧を見せる。
 *
 * サーバーが描くのは今日の一覧のほう。登録はブラウザにあるので差し替えは描画後になる。
 * 判断は Sidebar と同じ useFavorites を通す。物差しが二つあると、
 * 出ている画面と選択中の項目が食い違う。
 * 以前はここから曜日ページへ送っていたが、それだとトップの中身が空になり、
 * このサイトで唯一クロールされている画面に読むものが無くなっていた。
 */
export default function Home({
  crossSites,
  date,
  days,
  today,
  todayWorks,
}: HomeProps): React.JSX.Element {
  const favorites = useFavorites();

  return favorites.workUrls.length > 0 ? (
    <Favorites crossSites={crossSites} days={days} />
  ) : (
    <App crossSites={crossSites} date={date} day={today} works={todayWorks} />
  );
}
