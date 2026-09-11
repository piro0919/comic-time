"use client";
import useHasFavorites from "@/app/useHasFavorites";
import { type DateKey, type Weekday, type Work } from "@/types/work";
import App from "../App";
import Favorites, { type FavoritesProps } from "../Favorites";

export type HomeProps = {
  crossSites: FavoritesProps["crossSites"];
  /** 今日ぶんとして出している日。既読の判断に使う */
  date: DateKey;
  days: FavoritesProps["days"];
  /** クッキーに付いていた印。組み上がるまでの間、どちらを描くかの当て */
  hasFavorites: boolean;
  today: Weekday;
  todayWorks: Work[];
};

/**
 * 追いかける作品を登録している人には、その更新をまとめて見せる。
 * 何も登録していない人には今日の一覧を見せる。
 *
 * 登録はブラウザにあるので、サーバーは何を登録しているか知らない。ただ「あるかどうか」は
 * クッキーで受け取れるので、それを当てにして最初から正しい方を描く。
 * 組み上がったら localStorage が正本になり、食い違っていればそこで直る。
 * 読むのは Sidebar と同じ鍵の同じ形。useHasFavorites が答えるのは有無だけで、
 * 登録の中身を扱うのは今までどおり useFavorites に任せる。
 * 以前はここから曜日ページへ送っていたが、それだとトップの中身が空になり、
 * このサイトで唯一クロールされている画面に読むものが無くなっていた。
 */
export default function Home({
  crossSites,
  date,
  days,
  hasFavorites,
  today,
  todayWorks,
}: HomeProps): React.JSX.Element {
  const showFavorites = useHasFavorites(hasFavorites);

  return showFavorites ? (
    <Favorites crossSites={crossSites} days={days} />
  ) : (
    <App crossSites={crossSites} date={date} day={today} works={todayWorks} />
  );
}
