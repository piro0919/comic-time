import { type Metadata } from "next";
import Ranking from "../_components/Ranking";
import crossSiteWorks from "../crossSiteWorks";
import pageMetadata from "../pageMetadata";
import workRanking, { rankingPeriodLabel } from "../workRanking";

/*
 * 押された数は少しずつしか動かない。1週間ぶんの合計なので、
 * 6時間ごとに作り直せば足りる。見出しに出す集計期間が日をまたいで
 * 古いまま残る時間も、これなら長くならない。
 *
 * Next はここを式では読めないので、workRanking の pageRevalidate と
 * 同じ数を直に書く。片方を変えたらもう片方も変える。
 */
export const revalidate = 21600;

export function generateMetadata(): Metadata {
  return pageMetadata({
    description:
      "ComicTime で直近1週間によく開かれた Web 漫画のランキングです。読まれている作品を順位で並べています。",
    path: "/ranking",
    title: "ランキング",
  });
}

export default async function Page(): Promise<React.JSX.Element> {
  return (
    <Ranking
      crossSites={crossSiteWorks()}
      period={rankingPeriodLabel()}
      works={await workRanking()}
    />
  );
}
