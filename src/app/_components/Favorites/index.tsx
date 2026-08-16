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

/**
 * 登録した作品のうち、直近7日で更新されたものを日ごとに並べる。
 * 登録はブラウザに持たせているため、絞り込みは描画後に効く。
 */
export default function Favorites({ days }: FavoritesProps): React.JSX.Element {
  const favorites = useFavorites();
  const found = useMemo(
    () =>
      days
        .map((day) => ({
          ...day,
          works: day.works.filter((work) => favorites.hasWork(work.url)),
        }))
        .filter((day) => day.works.length > 0),
    [days, favorites],
  );

  if (found.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.empty}>
          この一週間で、登録した作品の更新はありません。
          <br />
          日付のページで作品の星を押すと、ここに集まります。
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {found.map((day) => (
        <section className={styles.section} key={day.label}>
          <div className={styles.dayHead}>
            <span className={styles.dayLabel}>{day.label}</span>
            <span className={styles.dayLine} />
          </div>
          <ul className={styles.grid}>
            {day.works.map((work) => (
              <WorkCard
                key={work.url}
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
