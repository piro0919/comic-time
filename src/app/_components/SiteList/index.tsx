import Link from "next/link";
import { type Site, siteHref, updateDayLabel } from "@/app/siteCatalog";
import styles from "./style.module.css";

export type SiteListProps = {
  sites: Site[];
};

/** 掲載しているサイトの一覧。検索から来た人の入口になる */
export default function SiteList({ sites }: SiteListProps): React.JSX.Element {
  return (
    <div className={styles.container}>
      <header className={styles.head}>
        <h1 className={styles.title}>サイト一覧</h1>
        <p className={styles.lead}>
          ComicTimeが更新を追いかけているWeb漫画サイトです。曜日と時刻は各サイトの更新のめやすです。
        </p>
      </header>
      <ul className={styles.grid}>
        {sites.map((site) => (
          <li className={styles.item} key={site.slug}>
            <Link className={styles.link} href={siteHref(site.slug)}>
              <span className={styles.name}>{site.name}</span>
              <span className={styles.meta}>
                {updateDayLabel(site.updateDay)}
                {site.updateTime === "" ? "" : ` ${site.updateTime}`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
