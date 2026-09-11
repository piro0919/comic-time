"use client";
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
 * どちらを出すかは登録の有無で決まり、登録は localStorage にしかない。
 * サーバーは読めないので、両方を描いて返し、出し分けは CSS に任せる。
 * 印を付けるのは globals.css の隣に置いた小さなスクリプトで、最初の描画より前に走る。
 * だから「今日の一覧が出てからお気に入りに入れ替わる」という見え方にならない。
 *
 * 描き分けを React でやると、組み上がるまで判断が付かず、その間ずっと
 * 違う方が出たままになる。実測で1.2秒あった。
 * クッキーでサーバーに伝える手もあるが、そうすると毎回サーバーで描くことになり、
 * 応答が 0.03 秒から 0.5 秒に落ちる。登録が無い人とクローラーにはただの損になる。
 *
 * 印が付かない相手——スクリプトを切っている人とクローラー——には今日の一覧が出る。
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
  return (
    <>
      <div data-home-view="today">
        <App
          crossSites={crossSites}
          date={date}
          day={today}
          works={todayWorks}
        />
      </div>
      <div data-home-view="favorites">
        <Favorites crossSites={crossSites} days={days} heading={false} />
      </div>
    </>
  );
}
