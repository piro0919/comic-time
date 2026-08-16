"use client";
import { config, useSpring } from "@react-spring/web";
import { createUseGesture, dragAction } from "@use-gesture/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { dayHref, days } from "@/app/days";
import { type Weekday, type Work } from "@/types/work";
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

export type AppProps = {
  day: Weekday;
  works: Work[];
};

export default function App({ day, works }: AppProps): React.JSX.Element {
  const router = useRouter();
  const cards = useMemo<Card[]>(
    () =>
      works.map<Card>((work) => ({
        thumbnailUrl: work.thumbnailUrl,
        title: work.title,
        url: work.url,
      })),
    [works],
  );
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
      <section className={styles.section}>
        <ul className={styles.grid}>
          {cards.map((card) => (
            <li className={styles.card} key={card.url}>
              <a
                className={styles.cardLink}
                href={card.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                <div className={styles.cover}>
                  <Image
                    alt=""
                    fill={true}
                    quality={100}
                    sizes="(width < 768px) 45vw, 180px"
                    src={card.thumbnailUrl ?? "/no-image.png"}
                  />
                </div>
                <div className={styles.cardBody}>
                  <span className={styles.cardTitle}>{card.title}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
