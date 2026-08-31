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
 *
 * 数百件並ぶので閉じておくが、畳むのは details に任せる。
 * 開いてから中身を作る作りにすると初期の HTML からリンクが消え、道が無くなる。
 */
export default function WorkIndex({
  heading,
  works,
}: WorkIndexProps): null | React.JSX.Element {
  if (works.length === 0) {
    return null;
  }

  return (
    <details className={styles.container}>
      <summary className={styles.summary}>
        <h2 className={styles.title}>{heading}</h2>
        <span className={styles.count}>{works.length}作品</span>
      </summary>
      <ul className={styles.list}>
        {works.map((work) => (
          <li key={work.slug}>
            <Link className={styles.link} href={workHref(work.slug)}>
              {work.title}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
