"use client";
import Image from "next/image";
import useEarlySites from "@/app/useEarlySites";
import styles from "./style.module.css";

export type SettingsProps = {
  sites: { name: string; slug: string; url: string }[];
};

/**
 * 設定の画面。いまあるのは、サイトごとに先読みの回を開くかどうかだけ。
 * 入れていないサイトのカードは、無料で読める最新の回へ送る。
 */
export default function Settings({ sites }: SettingsProps): React.JSX.Element {
  const earlySites = useEarlySites();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>設定</h1>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>先読みの回を開くサイト</h2>
        <p className={styles.note}>
          カードを押すと、無料で読める最新の回が開きます。会員で先読みまで読めるサイトに印を付けると、そのサイトだけはその日に出た回が開きます。
        </p>
        <ul className={styles.list}>
          {sites.map((site) => (
            <li key={site.url}>
              <label className={styles.item}>
                <Image
                  alt=""
                  className={styles.icon}
                  height={20}
                  src={`/site-icons/${site.slug}.png`}
                  width={20}
                />
                <span className={styles.name}>{site.name}</span>
                <input
                  onChange={() => {
                    earlySites.toggle(site.url);
                  }}
                  checked={earlySites.isEarly(site.url)}
                  className={styles.input}
                  type="checkbox"
                />
              </label>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
