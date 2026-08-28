"use client";
import { useEffect, useMemo } from "react";
import { FaStar } from "react-icons/fa";
import { type CrossSites } from "@/app/crossSiteWorks";
import useFavorites from "@/app/useFavorites";
import workCards, { type WorkCard as Card } from "@/app/workCards";
import { type DateKey, type Work } from "@/types/work";
import WorkCard from "../WorkCard";
import styles from "./style.module.css";

export type FavoritesProps = {
  crossSites: CrossSites;
  days: {
    date: DateKey;
    /** 「8/17（月）」の形 */
    label: string;
    works: Work[];
  }[];
};

/** 同じ日の同じ回に見つかった作品のかたまり */
type Batch = {
  cards: Card[];
  /** その回が並んでいる日 */
  date: DateKey;
  /** 「8/17（月）01:01」の形 */
  label: string;
};

/** この一週間、一度も更新されなかった登録 */
type Dormant = {
  /** 題名も分からず、どのカードにも繋がらないもの。捨てる */
  lost: string[];
  works: { key: string; title: string }[];
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
        .filter((card) => favorites.hasWork(card.workKey, card.legacyKeys))
        .forEach((card) => {
          const label = `${day.label}${card.foundAt}`;
          const last = result.at(-1);

          if (last !== undefined && last.label === label) {
            last.cards.push(card);

            return;
          }

          result.push({ cards: [card], date: day.date, label });
        });
    });

    return result;
  }, [crossSites, days, favorites]);
  /**
   * 登録してあるのに、この一週間どこにも出てこなかったもの。
   * 一覧から消えたままだと星を押せず、外す手立てが無くなるため下に並べる。
   */
  const dormant = useMemo<Dormant>(() => {
    const seen = new Set<string>();

    days.forEach((day) => {
      workCards(day.works, crossSites).forEach((card) => {
        seen.add(card.workKey);
        card.legacyKeys.forEach((entry) => seen.add(entry));
      });
    });

    const rest = favorites.workUrls.filter((entry) => !seen.has(entry));
    const works = rest
      .flatMap((key) => {
        const title = favorites.titles[key];

        return title === undefined ? [] : [{ key, title }];
      })
      .toSorted((a, b) => a.title.localeCompare(b.title, "ja"));
    const named = new Set(works.map((work) => work.key));

    return { lost: rest.filter((key) => !named.has(key)), works };
  }, [crossSites, days, favorites]);
  const hasDormant = dormant.works.length > 0;
  const { forgetWorks } = favorites;
  const lost = dormant.lost.join("\n");

  /**
   * 作品URLで登録していた頃のぶんのうち、この一週間どこにも出てこなかったもの。
   * 題名も分からず、押して外すこともできないので、開いたついでに捨てる。
   */
  useEffect(() => {
    if (lost === "") {
      return;
    }

    forgetWorks(lost.split("\n"));
  }, [forgetWorks, lost]);

  if (batches.length === 0 && !hasDormant) {
    return (
      <div className={styles.container}>
        <h1 className="visually-hidden">お気に入り</h1>
        <p className={styles.empty}>
          {favorites.workUrls.length === 0
            ? "お気に入りに追加した作品がここに表示されます。"
            : "過去 7 日間に更新はありません。"}
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
                date={batch.date}
                key={card.url}
                legacyKeys={card.legacyKeys}
                priority={batchIndex === 0 && cardIndex < 6}
                thumbnailUrl={card.thumbnailUrl}
                title={card.title}
                url={card.url}
                workKey={card.workKey}
              />
            ))}
          </ul>
        </section>
      ))}
      {hasDormant ? (
        <section className={styles.section}>
          <div className={styles.batchHead}>
            <span className={styles.batchLabel}>過去 7 日間に更新なし</span>
            <span className={styles.batchLine} />
          </div>
          <ul className={styles.dormant}>
            {dormant.works.map((work) => (
              <li className={styles.dormantItem} key={work.key}>
                <span className={styles.dormantTitle}>{work.title}</span>
                <button
                  onClick={() => {
                    favorites.toggleWork(work.key, []);
                  }}
                  aria-label={`${work.title}をお気に入りから削除`}
                  className={styles.dormantStar}
                  type="button"
                >
                  <FaStar color="#ffcd3b" size={16} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
