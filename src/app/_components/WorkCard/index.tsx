"use client";
import { track } from "@vercel/analytics";
import clsx from "clsx";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FaRegStar, FaStar } from "react-icons/fa";
import rankingEventName from "@/app/rankingEventName";
import useFavorites from "@/app/useFavorites";
import useOpened from "@/app/useOpened";
import { type CardSite } from "@/app/workCards";
import { type DateKey } from "@/types/work";
import styles from "./style.module.css";

export type WorkCardProps = {
  /** 複数サイトに載っている作品だけ、どのサイトのぶんかを印で出す */
  badge: CardSite | null;
  /** このカードが並んでいる日。既読はこの日のぶんとして見る */
  date: DateKey;
  /** 昔の形での登録。見つけたら今の見出しに移す */
  legacyKeys: string[];
  /** 最初の画面に映る位置なら true。読み込みを後回しにしない */
  priority?: boolean;
  thumbnailUrl: null | string;
  title: string;
  url: string;
  /** お気に入りの見出し */
  workKey: string;
};

/** 弾ける粒の数。角度は CSS の nth-child で配る */
const sparks = [0, 1, 2, 3, 4, 5];

/** 作品1枚ぶん。星を押すとお気に入りに入る */
export default function WorkCard({
  badge,
  date,
  legacyKeys,
  priority = false,
  thumbnailUrl,
  title,
  url,
  workKey,
}: WorkCardProps): React.JSX.Element {
  const favorites = useFavorites();
  const opened = useOpened();
  const added = favorites.hasWork(workKey, legacyKeys);
  const { adoptTitle, rememberTitle } = favorites;
  /** 配列は描き直すたびに別物になる。中身で見て、無駄に動かさない */
  const legacyKey = legacyKeys.join("\n");

  // 昔はURLで登録していた。開いたついでに、揃えたタイトルへ移しておく
  useEffect(() => {
    adoptTitle(workKey, legacyKey.split("\n"));
  }, [adoptTitle, legacyKey, workKey]);

  /**
   * 登録済みの作品が一覧に出てきたら、題名を控える。
   * 更新が途切れて一覧から消えたあとも、名前で並べられるようにするため。
   */
  useEffect(() => {
    if (added) {
      rememberTitle(workKey, title);
    }
  }, [added, rememberTitle, title, workKey]);

  const read = opened.isOpened(url, date);
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
          opened.markOpened(url);
          // ランキングの元になる数。押した回だけ送る
          track(rankingEventName, { title });
        }}
        aria-label={title}
        className={styles.cardLink}
        href={url}
        rel="noopener noreferrer"
        target="_blank"
      />
      <button
        aria-label={
          added ? `${title}をお気に入りから削除` : `${title}をお気に入りに追加`
        }
        onClick={() => {
          // 外すときは静かに消す。祝うのは入れたときだけ
          if (!added) {
            setBurst((count) => count + 1);
          }

          favorites.toggleWork(workKey, legacyKeys);
        }}
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
