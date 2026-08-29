import Image from "next/image";
import { type RankedWork } from "@/app/workRanking";
import styles from "./style.module.css";

export type RankingProps = {
  works: RankedWork[];
};

/**
 * 直近1週間でよく開かれた作品。
 * 順位が主役なので、カードを並べずに縦の一覧にする。
 */
export default function Ranking({ works }: RankingProps): React.JSX.Element {
  return (
    <div className={styles.container}>
      <header className={styles.head}>
        <h1 className={styles.title}>ランキング</h1>
        <p className={styles.note}>直近1週間で開かれた回数の多い作品です。</p>
      </header>
      {works.length === 0 ? (
        <p className={styles.empty}>
          まだ集計できる数がありません。しばらく経ってから見に来てください。
        </p>
      ) : (
        <ol className={styles.list}>
          {works.map((work, index) => (
            <li className={styles.row} key={work.title}>
              <span className={styles.rank}>{work.rank}</span>
              <div className={styles.cover}>
                <Image
                  alt=""
                  fill={true}
                  priority={index < 5}
                  quality={100}
                  sizes="72px"
                  src={work.thumbnailUrl ?? "/no-image.png"}
                />
              </div>
              <div className={styles.body}>
                <span className={styles.name}>{work.title}</span>
                <span className={styles.meta}>
                  {work.sites.length > 1 ? (
                    <span className={styles.icons}>
                      {work.sites.map((site) => (
                        <Image
                          alt={site.name}
                          height={16}
                          key={site.siteUrl}
                          src={site.iconUrl}
                          width={16}
                        />
                      ))}
                    </span>
                  ) : (
                    <span className={styles.siteName}>
                      {work.sites[0]?.name}
                    </span>
                  )}
                  <span className={styles.count}>{work.count}回</span>
                </span>
              </div>
              {/* 行全体を覆うリンク。順位も絵も題も押せる */}
              <a
                aria-label={work.title}
                className={styles.link}
                href={work.url}
                rel="noopener noreferrer"
                target="_blank"
              />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
