"use client";
import Image from "next/image";
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

/** 作品1枚ぶん。星を押すとお気に入りに入る */
export default function WorkCard({
  priority = false,
  thumbnailUrl,
  title,
  url,
}: WorkCardProps): React.JSX.Element {
  const favorites = useFavorites();

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
          favorites.toggleWork(url);
        }}
        aria-label={`${title}をお気に入りに入れる`}
        className={styles.cardStar}
        type="button"
      >
        {favorites.hasWork(url) ? (
          <FaStar color="#ffcd3b" size={18} />
        ) : (
          <FaRegStar color="#fff" size={18} />
        )}
      </button>
    </li>
  );
}
