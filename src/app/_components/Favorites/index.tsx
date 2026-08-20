"use client";
import { useMemo } from "react";
import { type CrossSites } from "@/app/crossSiteWorks";
import useFavorites from "@/app/useFavorites";
import workCards, { type WorkCard as Card } from "@/app/workCards";
import { type Work } from "@/types/work";
import WorkCard from "../WorkCard";
import styles from "./style.module.css";

export type FavoritesProps = {
  crossSites: CrossSites;
  days: {
    /** 「8/17（月）」の形 */
    label: string;
    works: Work[];
  }[];
};

/** 同じ日の同じ回に見つかった作品のかたまり */
type Batch = {
  cards: Card[];
  /** 「8/17（月）01:01」の形 */
  label: string;
};

/**
 * 登録した作品のうち、直近7日で更新されたものを、
 * 日別の画面と同じく見つけた回で区切って並べる。
 * 登録はブラウザに持たせているため、絞り込みは描画後に効く。
 */
export default function Favorites({
  crossSites,
  days,
}: FavoritesProps): React.JSX.Element {
  const favorites = useFavorites();
  const batches = useMemo<Batch[]>(() => {
    const result: Batch[] = [];

    days.forEach((day) => {
      workCards(day.works, crossSites)
        .filter((card) => favorites.hasWork(card.workKey, card.urls))
        .forEach((card) => {
          const label = `${day.label}${card.foundAt}`;
          const last = result.at(-1);

          if (last !== undefined && last.label === label) {
            last.cards.push(card);

            return;
          }

          result.push({ cards: [card], label });
        });
    });

    return result;
  }, [crossSites, days, favorites]);

  if (batches.length === 0) {
    return (
      <div className={styles.container}>
        <h1 className="visually-hidden">お気に入り</h1>
        <p className={styles.empty}>
          {favorites.workUrls.length === 0
            ? "お気に入り登録した作品が、ここに表示されます。"
            : "この一週間、更新はありません。"}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className="visually-hidden">お気に入り</h1>
      {batches.map((batch, batchIndex) => (
        <section className={styles.section} key={batch.label}>
          <div className={styles.batchHead}>
            <span className={styles.batchLabel}>{`${batch.label} 更新`}</span>
            <span className={styles.batchLine} />
          </div>
          <ul className={styles.grid}>
            {batch.cards.map((card, cardIndex) => (
              <WorkCard
                badge={card.badge}
                key={card.url}
                priority={batchIndex === 0 && cardIndex < 6}
                thumbnailUrl={card.thumbnailUrl}
                title={card.title}
                url={card.url}
                urls={card.urls}
                workKey={card.workKey}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
