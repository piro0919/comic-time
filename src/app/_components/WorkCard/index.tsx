"use client";
import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import { FaRegStar, FaStar } from "react-icons/fa";
import useFavorites from "@/app/useFavorites";
import useOpened from "@/app/useOpened";
import { type CardSite } from "@/app/workCards";
import styles from "./style.module.css";

export type WorkCardProps = {
  /** 複数サイトに載っている作品だけ、どのサイトのぶんかを印で出す */
  badge: CardSite | null;
  /** 最初の画面に映る位置なら true。読み込みを後回しにしない */
  priority?: boolean;
  thumbnailUrl: null | string;
  title: string;
  url: string;
  /** 同じ作品が載っている全サイトぶんのURL。お気に入りはまとめて入れ替える */
  urls: string[];
};

/** 弾ける粒の数。角度は CSS の nth-child で配る */
const sparks = [0, 1, 2, 3, 4, 5];

/** 作品1枚ぶん。星を押すとお気に入りに入る */
export default function WorkCard({
  badge,
  priority = false,
  thumbnailUrl,
  title,
  url,
  urls,
}: WorkCardProps): React.JSX.Element {
  const favorites = useFavorites();
  const opened = useOpened();
  const added = favorites.hasAnyWork(urls);
  const read = opened.isOpened(urls);
  /**
   * 押すたびに数を進め、key を変えて描き直させる。
   * こうしないと2回目以降は同じ要素のままで、animation が始まらない。
   */
  const [burst, setBurst] = useState(0);
  /** 読み込んだ時点で入っているものは祝わない。押した回だけ動かす */
  const celebrating = burst > 0 && added;

  return (
    <li className={clsx(styles.card, read && styles.isOpened)}>
      <div className={styles.cover}>
        <Image
          alt=""
          fill={true}
          priority={priority}
          quality={100}
          sizes="(width < 768px) 45vw, 220px"
          src={thumbnailUrl ?? "/no-image.png"}
        />
        {read ? <span className={styles.openedMark}>既読</span> : null}
        {badge === null ? null : (
          // 同じ作品が複数サイトにあるときだけ、どこのぶんかを出す
          <span className={styles.siteIcon} title={badge.name}>
            <Image
              alt={badge.name}
              height={40}
              src={badge.iconUrl}
              width={40}
            />
          </span>
        )}
      </div>
      <div className={styles.cardBody}>
        <span className={styles.cardTitle}>{title}</span>
      </div>
      {/* カード全体を覆うリンク。押す場所を絵と題の両方にする */}
      <a
        onClick={() => {
          // 同じ回が複数サイトにあるなら、まとめて既読にする
          opened.markOpened(urls);
        }}
        aria-label={title}
        className={styles.cardLink}
        href={url}
        rel="noopener noreferrer"
        target="_blank"
      />
      <button
        onClick={() => {
          // 外すときは静かに消す。祝うのは入れたときだけ
          if (!added) {
            setBurst((count) => count + 1);
          }

          favorites.toggleWorks(urls);
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
