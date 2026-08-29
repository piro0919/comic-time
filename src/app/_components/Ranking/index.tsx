"use client";
import { type CrossSites } from "@/app/crossSiteWorks";
import workCards from "@/app/workCards";
import { type RankedWork } from "@/app/workRanking";
import WorkCard from "../WorkCard";
import styles from "./style.module.css";

export type RankingProps = {
  crossSites: CrossSites;
  works: RankedWork[];
};

/**
 * 直近1週間でよく開かれた作品。
 * カードは曜日の一覧と同じものを使う。順位だけを絵の上に載せる。
 */
export default function Ranking({
  crossSites,
  works,
}: RankingProps): React.JSX.Element {
  return (
    <div className={styles.container}>
      <header className={styles.head}>
        <h1 className={styles.title}>ランキング</h1>
        <p className={styles.note}>直近1週間で開かれた回数の多い作品です。</p>
      </header>
      {works.length === 0 ? (
        <p className={styles.note}>
          まだ集計できる数がありません。しばらく経ってから見に来てください。
        </p>
      ) : (
        <ul className={styles.grid}>
          {works.map((ranked, index) => {
            const [card] = workCards([ranked.work], crossSites);

            if (card === undefined) {
              return null;
            }

            return (
              <WorkCard
                badge={card.badge}
                date={ranked.date}
                key={card.url}
                legacyKeys={card.legacyKeys}
                priority={index < 6}
                rank={ranked.rank}
                thumbnailUrl={card.thumbnailUrl}
                title={card.title}
                url={card.url}
                workKey={card.workKey}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
