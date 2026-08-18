import Link from "next/link";
import { type Site, updateDayLabel } from "@/app/siteCatalog";
import { dateLabel } from "@/app/worksOfDay";
import { type DateKey, type Work } from "@/types/work";
import WorkCard from "../WorkCard";
import styles from "./style.module.css";

export type SiteDetailProps = {
  days: { date: DateKey; works: Work[] }[];
  site: Site;
};

/** サイト1つぶん。更新のめやすと、この一週間に出た作品を並べる */
export default function SiteDetail({
  days,
  site,
}: SiteDetailProps): React.JSX.Element {
  return (
    <div className={styles.container}>
      <header className={styles.head}>
        <h1 className={styles.title}>{site.name}の更新</h1>
        <dl className={styles.facts}>
          <div className={styles.fact}>
            <dt className={styles.factKey}>更新曜日</dt>
            <dd className={styles.factValue}>
              {updateDayLabel(site.updateDay)}
            </dd>
          </div>
          {site.updateTime === "" ? null : (
            <div className={styles.fact}>
              <dt className={styles.factKey}>更新時刻</dt>
              <dd className={styles.factValue}>{site.updateTime}</dd>
            </div>
          )}
        </dl>
        <a
          className={styles.official}
          href={site.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          {`${site.name}を開く`}
        </a>
      </header>
      {days.length === 0 ? (
        <p className={styles.empty}>この一週間の更新はまだありません。</p>
      ) : (
        days.map((day) => (
          <section className={styles.section} key={day.date}>
            <div className={styles.dayHead}>
              <h2 className={styles.dayLabel}>{dateLabel(day.date)}</h2>
              <span className={styles.dayLine} />
            </div>
            <ul className={styles.grid}>
              {day.works.map((work) => (
                <WorkCard
                  key={work.url}
                  thumbnailUrl={work.thumbnailUrl}
                  title={work.title}
                  url={work.url}
                />
              ))}
            </ul>
          </section>
        ))
      )}
      <Link className={styles.back} href="/sites">
        サイト一覧へ戻る
      </Link>
    </div>
  );
}
