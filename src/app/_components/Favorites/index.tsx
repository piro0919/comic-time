"use client";
import { useMemo } from "react";
import useFavorites from "@/app/useFavorites";
import { type Work } from "@/types/work";
import WorkCard from "../WorkCard";
import styles from "./style.module.css";

export type FavoritesProps = {
  days: {
    /** 「8/17（月）」の形 */
    label: string;
    works: Work[];
  }[];
};

/** 同じ日の同じ回に見つかった作品のかたまり */
type Batch = {
  /** 「8/17（月）01:01」の形 */
  label: string;
  works: Work[];
};

/**
 * 登録した作品のうち、直近7日で更新されたものを、
 * 日別の画面と同じく見つけた回で区切って並べる。
 * 登録はブラウザに持たせているため、絞り込みは描画後に効く。
 */
export default function Favorites({ days }: FavoritesProps): React.JSX.Element {
  const favorites = useFavorites();
  const batches = useMemo<Batch[]>(() => {
    const result: Batch[] = [];

    days.forEach((day) => {
      day.works
        .filter((work) => favorites.hasWork(work.url))
        .forEach((work) => {
          const label = `${day.label}${work.foundAt}`;
          const last = result.at(-1);

          if (last !== undefined && last.label === label) {
            last.works.push(work);

            return;
          }

          result.push({ label, works: [work] });
        });
    });

    return result;
  }, [days, favorites]);

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
            {batch.works.map((work, workIndex) => (
              <WorkCard
                key={work.url}
                priority={batchIndex === 0 && workIndex < 6}
                thumbnailUrl={work.thumbnailUrl}
                title={work.title}
                url={work.url}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
