"use client";
import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import { FaRegStar, FaStar } from "react-icons/fa";
import useFavorites from "@/app/useFavorites";
import styles from "./style.module.css";

export type WorkCardProps = {
  /** 最初の画面に映る位置なら true。読み込みを後回しにしない */
  priority?: boolean;
  thumbnailUrl: null | string;
  title: string;
  url: string;
};

/** 弾ける粒の数。角度は CSS の nth-child で配る */
const sparks = [0, 1, 2, 3, 4, 5];

/** 作品1枚ぶん。星を押すとお気に入りに入る */
export default function WorkCard({
  priority = false,
  thumbnailUrl,
  title,
  url,
}: WorkCardProps): React.JSX.Element {
  const favorites = useFavorites();
  const added = favorites.hasWork(url);
  /**
   * 押すたびに数を進め、key を変えて描き直させる。
   * こうしないと2回目以降は同じ要素のままで、animation が始まらない。
   */
  const [burst, setBurst] = useState(0);
  /** 読み込んだ時点で入っているものは祝わない。押した回だけ動かす */
  const celebrating = burst > 0 && added;

  return (
    <li className={styles.card}>
      <a
        className={styles.cardLink}
        href={url}
        rel="noopener noreferrer"
        target="_blank"
      >
        <div className={styles.cover}>
          <Image
            alt=""
            fill={true}
            priority={priority}
            quality={100}
            sizes="(width < 768px) 45vw, 180px"
            src={thumbnailUrl ?? "/no-image.png"}
          />
        </div>
        <div className={styles.cardBody}>
          <span className={styles.cardTitle}>{title}</span>
        </div>
      </a>
      <button
        onClick={() => {
          // 外すときは静かに消す。祝うのは入れたときだけ
          if (!added) {
            setBurst((count) => count + 1);
          }

          favorites.toggleWork(url);
        }}
        aria-label={`${title}をお気に入りに入れる`}
        className={styles.cardStar}
        type="button"
      >
        {celebrating ? (
          <span
            aria-hidden="true"
            className={styles.burst}
            key={`burst-${burst}`}
          >
            <span className={styles.ring} />
            {sparks.map((index) => (
              <span className={styles.spark} key={index} />
            ))}
          </span>
        ) : null}
        <span
          className={clsx(styles.icon, celebrating && styles.pop)}
          key={`icon-${burst}`}
        >
          {added ? (
            <FaStar color="#ffcd3b" size={18} />
          ) : (
            <FaRegStar color="#fff" size={18} />
          )}
        </span>
      </button>
    </li>
  );
}
