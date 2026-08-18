import Image from "next/image";
import Link from "next/link";
import { type Site, siteHref } from "@/app/siteCatalog";
import styles from "./style.module.css";

export type SiteListProps = {
  sites: Site[];
};

/** 掲載しているサイトの一覧。作品のカードと同じ見え方に揃える */
export default function SiteList({ sites }: SiteListProps): React.JSX.Element {
  return (
    <div className={styles.container}>
      <header className={styles.head}>
        <h1 className={styles.title}>サイト一覧</h1>
      </header>
      <ul className={styles.grid}>
        {sites.map((site) => (
          <li className={styles.card} key={site.slug}>
            <Link className={styles.cardLink} href={siteHref(site.slug)}>
              <div className={styles.cover}>
                <Image
                  alt=""
                  fill={true}
                  quality={100}
                  sizes="(width < 768px) 45vw, 180px"
                  src={site.imageUrl ?? "/no-image.png"}
                />
              </div>
              <div className={styles.cardBody}>
                <span className={styles.cardTitle}>{site.name}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
