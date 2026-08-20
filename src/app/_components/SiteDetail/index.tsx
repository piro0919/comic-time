import { type CrossSites } from "@/app/crossSiteWorks";
import { type Site } from "@/app/siteCatalog";
import workCards from "@/app/workCards";
import { dateLabel } from "@/app/worksOfDay";
import { type DateKey, type Work } from "@/types/work";
import WorkCard from "../WorkCard";
import styles from "./style.module.css";

export type SiteDetailProps = {
  crossSites: CrossSites;
  days: { date: DateKey; works: Work[] }[];
  site: Site;
};

/** サイト1つぶん。この一週間に出た作品を並べる */
export default function SiteDetail({
  crossSites,
  days,
  site,
}: SiteDetailProps): React.JSX.Element {
  return (
    <div className={styles.container}>
      <header className={styles.head}>
        <h1 className={styles.title}>{site.name}</h1>
      </header>
      {days.length === 0 ? (
        <p className={styles.empty}>この一週間の更新はまだありません。</p>
      ) : (
        days.map((day, dayIndex) => (
          <section className={styles.section} key={day.date}>
            <div className={styles.dayHead}>
              <h2 className={styles.dayLabel}>{dateLabel(day.date)}</h2>
              <span className={styles.dayLine} />
            </div>
            <ul className={styles.grid}>
              {workCards(day.works, crossSites).map((card, cardIndex) => (
                <WorkCard
                  badge={card.badge}
                  key={card.url}
                  priority={dayIndex === 0 && cardIndex < 6}
                  thumbnailUrl={card.thumbnailUrl}
                  title={card.title}
                  url={card.url}
                  urls={card.urls}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
