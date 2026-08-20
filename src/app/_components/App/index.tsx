"use client";
import { config, useSpring } from "@react-spring/web";
import { createUseGesture, dragAction } from "@use-gesture/react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { dayHref, dayLabel, days } from "@/app/days";
import { type Weekday, type Work } from "@/types/work";
import WorkCard from "../WorkCard";
import styles from "./style.module.css";

const _config = {
  soft: config.default,
  stiff: { friction: 20, tension: 200 },
};
const useGesture = createUseGesture([dragAction]);

/** カードひとつぶん。どのサイトの作品かは画面には出さない */
type Card = {
  thumbnailUrl: null | string;
  title: string;
  url: string;
};

/** 同じ回の取得で見つかった作品のかたまり */
type Batch = {
  cards: Card[];
  foundAt: string;
};

export type AppProps = {
  day: Weekday;
  works: Work[];
};

export default function App({ day, works }: AppProps): React.JSX.Element {
  const router = useRouter();
  /** 見つけた回ごとに区切って並べる。上ほど新しい更新 */
  const batches = useMemo<Batch[]>(() => {
    const result: Batch[] = [];

    works.forEach((work) => {
      const card = {
        thumbnailUrl: work.thumbnailUrl,
        title: work.title,
        url: work.url,
      };
      const last = result.at(-1);

      if (last !== undefined && last.foundAt === work.foundAt) {
        last.cards.push(card);

        return;
      }

      result.push({ cards: [card], foundAt: work.foundAt });
    });

    return result;
  }, [works]);
  const [props, api] = useSpring(() => ({ x: 0 }));
  const bind = useGesture(
    {
      onDrag: ({ active, offset: [x], swipe: [swipeX] }) => {
        if (swipeX) {
          const dayIndex = days.findIndex(({ key }) => key === day);
          const nextIndex = dayIndex + (swipeX > 0 ? 1 : -1);
          const next = days.at(nextIndex >= days.length ? 0 : nextIndex);

          if (next !== undefined) {
            router.push(dayHref(next.key));
          }
        }

        api.start(
          active
            ? { config: _config.stiff, x }
            : { config: _config.soft, x: 0 },
        );
      },
    },
    {
      drag: {
        axis: "x",
        from: () => [props.x.get(), 0],
        pointer: { capture: false },
      },
    },
  );

  return (
    <div {...bind()} className={styles.container}>
      <h1 className="visually-hidden">{`${dayLabel(day)}の更新`}</h1>
      {batches.map((batch, batchIndex) => (
        <section className={styles.section} key={batch.foundAt}>
          <div className={styles.batchHead}>
            <span className={styles.batchTime}>{`${batch.foundAt} 更新`}</span>
            <span className={styles.batchLine} />
          </div>
          <ul className={styles.grid}>
            {batch.cards.map((card, cardIndex) => (
              <WorkCard
                key={card.url}
                priority={batchIndex === 0 && cardIndex < 6}
                thumbnailUrl={card.thumbnailUrl}
                title={card.title}
                url={card.url}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
