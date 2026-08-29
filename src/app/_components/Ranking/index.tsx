"use client";
import clsx from "clsx";
import { type CrossSites } from "@/app/crossSiteWorks";
import workCards from "@/app/workCards";
import { type RankedWork } from "@/app/workRanking";
import WorkCard from "../WorkCard";
import styles from "./style.module.css";

export type RankingProps = {
  crossSites: CrossSites;
  works: RankedWork[];
};

/** 表彰台に載せる数。ここまでは大きく、以降は曜日の一覧と同じ大きさ */
const podiumSize = 3;
/** 上位3つの色。順に金・銀・銅 */
const podiumStyles = [styles.first, styles.second, styles.third];

export default function Ranking({
  crossSites,
  works,
}: RankingProps): React.JSX.Element {
  const cards = works.flatMap((ranked, index) => {
    const [card] = workCards([ranked.work], crossSites);

    return card === undefined ? [] : [{ ...card, index, ranked }];
  });
  const podium = cards.slice(0, podiumSize);
  const rest = cards.slice(podiumSize);

  return (
    <div className={styles.container}>
      <header className={styles.head}>
        <h1 className={styles.title}>ランキング</h1>
        <p className={styles.note}>直近1週間で開かれた回数の多い作品です。</p>
      </header>
      {cards.length === 0 ? (
        <p className={styles.note}>
          まだ集計できる数がありません。しばらく経ってから見に来てください。
        </p>
      ) : null}
      {podium.length === 0 ? null : (
        <ul className={styles.podium}>
          {podium.map((card) => (
            <WorkCard
              badge={card.badge}
              className={clsx(styles.seat, podiumStyles[card.index])}
              count={card.ranked.count}
              date={card.ranked.date}
              key={card.url}
              legacyKeys={card.legacyKeys}
              priority={true}
              thumbnailUrl={card.thumbnailUrl}
              title={card.title}
              url={card.url}
              workKey={card.workKey}
            />
          ))}
        </ul>
      )}
      {rest.length === 0 ? null : (
        <ul className={styles.grid}>
          {rest.map((card) => (
            <WorkCard
              badge={card.badge}
              count={card.ranked.count}
              date={card.ranked.date}
              key={card.url}
              legacyKeys={card.legacyKeys}
              thumbnailUrl={card.thumbnailUrl}
              title={card.title}
              url={card.url}
              workKey={card.workKey}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
