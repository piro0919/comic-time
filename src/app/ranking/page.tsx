import { type Metadata } from "next";
import Ranking from "../_components/Ranking";
import pageMetadata from "../pageMetadata";
import workRanking from "../workRanking";

/*
 * 押された数は少しずつしか動かない。1時間ごとに作り直せば足りる。
 * Next はここを式では読めないので、workRanking の pageRevalidate と
 * 同じ数を直に書く。片方を変えたらもう片方も変える。
 */
export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return pageMetadata({
    description:
      "ComicTime で直近1週間によく開かれた Web 漫画のランキングです。読まれている作品を順位で並べています。",
    path: "/ranking",
    title: "ランキング",
  });
}

export default async function Page(): Promise<React.JSX.Element> {
  return <Ranking works={await workRanking()} />;
}
