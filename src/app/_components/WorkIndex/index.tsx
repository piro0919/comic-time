import Link from "next/link";
import { workHref } from "@/app/workCatalog";
import { type CatalogEntry } from "@/types/work";
import styles from "./style.module.css";

export type WorkIndexProps = {
  heading: string;
  works: CatalogEntry[];
};

/**
 * 作品ページへの道。曜日ページとサイトページの末尾に置く。
 *
 * カードを押した先は掲載サイトなので、作品ページへ入る口がどこにも無かった。
 * サイトマップにしか載っていない住所はクローラが後回しにするため、
 * 1700枚ある作品ページが「見つけたが読んでいない」まま寝ていた。
 * 題名だけを並べた素のリンクを置いて、そこを通す。
 */
export default function WorkIndex({
  heading,
  works,
}: WorkIndexProps): null | React.JSX.Element {
  if (works.length === 0) {
    return null;
  }

  return (
    <section className={styles.container}>
      <h2 className={styles.title}>{heading}</h2>
      <ul className={styles.list}>
        {works.map((work) => (
          <li key={work.slug}>
            <Link className={styles.link} href={workHref(work.slug)}>
              {work.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
