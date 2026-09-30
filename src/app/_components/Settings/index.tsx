"use client";
import clsx from "clsx";
import Image from "next/image";
import useEarlySites from "@/app/useEarlySites";
import styles from "./style.module.css";

export type SettingsProps = {
  sites: { name: string; slug: string; url: string }[];
};

/**
 * 設定の画面。いまあるのは、サイトごとに先読みの回を開くかどうかだけ。
 * 入れていないサイトのカードは、無料で読める最新の回へ送る。
 *
 * 20あまりのサイトを1列に並べると、スマホで2画面を超えて見渡せない。
 * 名前と絵だけの札にして、幅に合わせて何列かに並べる。札を押すと切り替わる。
 */
export default function Settings({ sites }: SettingsProps): React.JSX.Element {
  const earlySites = useEarlySites();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>設定</h1>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>先読みの回を開くサイト</h2>
        <p className={styles.note}>
          カードを押すと、無料で読める最新の回が開きます。会員で先読みまで読めるサイトを選ぶと、そのサイトだけはその日に出た回が開きます。
        </p>
        <ul className={styles.grid}>
          {sites.map((site) => {
            const early = earlySites.isEarly(site.url);

            return (
              <li key={site.url}>
                <button
                  onClick={() => {
                    earlySites.toggle(site.url);
                  }}
                  aria-pressed={early}
                  className={clsx(styles.chip, early && styles.isEarly)}
                  type="button"
                >
                  <Image
                    alt=""
                    className={styles.icon}
                    height={20}
                    src={`/site-icons/${site.slug}.png`}
                    width={20}
                  />
                  <span className={styles.name}>{site.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
