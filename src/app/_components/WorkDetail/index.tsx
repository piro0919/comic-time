import Image from "next/image";
import Link from "next/link";
import { siteHref } from "@/app/siteCatalog";
import siteSlug from "@/app/siteSlug";
import { seenDaysLabel } from "@/app/workCatalog";
import { dateLabel } from "@/app/worksOfDay";
import { type CatalogEntry } from "@/types/work";
import styles from "./style.module.css";

export type WorkDetailProps = {
  work: CatalogEntry;
};

/**
 * 作品1つぶん。「この作品は何曜日に更新されるのか」「どこで読めるのか」に答える。
 *
 * 出しているのは台帳に貯めた実績で、サイトが掲げている更新日ではない。
 * 隔週や月1の作品は曜日が1つしか出ないので、言い切らない書き方にしている。
 */
export default function WorkDetail({
  work,
}: WorkDetailProps): React.JSX.Element {
  const days = seenDaysLabel(work.dayBits);

  return (
    <div className={styles.container}>
      <header className={styles.head}>
        <div className={styles.cover}>
          <Image
            alt=""
            fill={true}
            priority={true}
            quality={100}
            sizes="(width < 768px) 45vw, 260px"
            src={work.thumbnailUrl ?? "/no-image.png"}
          />
        </div>
        <div className={styles.summary}>
          <h1 className={styles.title}>{work.title}</h1>
          <dl className={styles.facts}>
            {days === "" ? null : (
              <div className={styles.fact}>
                <dt className={styles.factLabel}>更新を見た曜日</dt>
                <dd className={styles.factValue}>{days}</dd>
              </div>
            )}
            <div className={styles.fact}>
              <dt className={styles.factLabel}>最後の更新</dt>
              <dd className={styles.factValue}>{dateLabel(work.lastSeen)}</dd>
            </div>
          </dl>
        </div>
      </header>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>読めるサイト</h2>
        <ul className={styles.sites}>
          {work.sites.map((site) => (
            <li className={styles.site} key={site.siteUrl}>
              <a
                className={styles.siteLink}
                href={site.url}
                rel="noreferrer"
                target="_blank"
              >
                <Image
                  alt=""
                  className={styles.siteIcon}
                  height={20}
                  src={`/site-icons/${siteSlug(site.siteUrl)}.png`}
                  width={20}
                />
                <span className={styles.siteName}>{site.name}で読む</span>
              </a>
              <Link
                className={styles.siteMore}
                href={siteHref(siteSlug(site.siteUrl))}
              >
                {site.name}の更新曜日
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <p className={styles.note}>
        更新の曜日は、ComicTime が実際に更新を見つけた日から作っています。
        隔週・月1の作品は曜日が1つだけ出ます。
      </p>
    </div>
  );
}
