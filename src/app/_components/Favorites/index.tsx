"use client";
import { useMemo } from "react";
import { FaStar } from "react-icons/fa";
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
  /** 台帳のサイト。題名を控えていない古い登録を、URLから見分けるのに使う */
  sites: { name: string; url: string }[];
};

/** 同じ日の同じ回に見つかった作品のかたまり */
type Batch = {
  cards: Card[];
  /** 「8/17（月）01:01」の形 */
  label: string;
};

/** この一週間、一度も更新されなかった登録 */
type Dormant = {
  works: {
    key: string;
    /** 題名が分かるならそれ。分からなければサイト名 */
    label: string;
    /** 作品URLで登録されていた古いぶんだけ、開いて確かめられる */
    url: null | string;
  }[];
};

/**
 * 登録した作品のうち、直近7日で更新されたものを、
 * 日別の画面と同じく見つけた回で区切って並べる。
 * 登録はブラウザに持たせているため、絞り込みは描画後に効く。
 */
export default function Favorites({
  crossSites,
  days,
  sites,
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

          result.push({ cards: [card], label });
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
      .flatMap<Dormant["works"][number]>((key) => {
        const title = favorites.titles[key];

        if (title !== undefined) {
          return [{ key, label: title, url: null }];
        }

        // 作品URLで登録していた頃のぶん。題名は残っていないが、出どころは分かる
        const site = sites.find((entry) => key.startsWith(entry.url));

        return site === undefined ? [] : [{ key, label: site.name, url: key }];
      })
      .toSorted((a, b) => a.label.localeCompare(b.label, "ja"));

    return { works };
  }, [crossSites, days, favorites, sites]);
  const hasDormant = dormant.works.length > 0;

  if (batches.length === 0 && !hasDormant) {
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
            <span className={styles.batchLabel}>7日以内の更新なし</span>
            <span className={styles.batchLine} />
          </div>
          <ul className={styles.dormant}>
            {dormant.works.map((work) => (
              <li className={styles.dormantItem} key={work.key}>
                {work.url === null ? (
                  <span className={styles.dormantTitle}>{work.label}</span>
                ) : (
                  // 題名が無いぶんは、登録した回へのリンクだけが手がかり
                  <a
                    className={styles.dormantTitle}
                    href={work.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {`${work.label}に登録した回（題名なし）`}
                  </a>
                )}
                <button
                  onClick={() => {
                    favorites.toggleWork(work.key, []);
                  }}
                  aria-label={`${work.label}をお気に入りから外す`}
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
