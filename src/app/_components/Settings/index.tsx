"use client";
import clsx from "clsx";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { MdInfoOutline } from "react-icons/md";
import useEarlySites from "@/app/useEarlySites";
import useIsHydrated from "@/app/useIsHydrated";
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
  /*
   * 設定は localStorage にあり、画面より先に読み終わることがある。
   * 組み上がる前から選んだ色で描くとサーバーの描画と食い違い、React はそれを直さない
   */
  const hydrated = useIsHydrated();
  // 説明は知りたい人だけが開く。常に出しておくと、札より先に文章を読まされる
  const [explained, setExplained] = useState(false);
  const noteId = useId();
  const infoRef = useRef<HTMLDivElement>(null);

  // 吹き出しは、外を押すか Esc で閉じる
  useEffect(() => {
    if (!explained) {
      return undefined;
    }

    const close = (event: KeyboardEvent | PointerEvent): void => {
      if (
        event instanceof KeyboardEvent
          ? event.key === "Escape"
          : !infoRef.current?.contains(event.target as Node)
      ) {
        setExplained(false);
      }
    };

    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);

    return (): void => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", close);
    };
  }, [explained]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>設定</h1>
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>先読みで読むサイト</h2>
          <div className={styles.infoWrap} ref={infoRef}>
            <button
              onClick={() => {
                setExplained((prev) => !prev);
              }}
              aria-controls={noteId}
              aria-expanded={explained}
              aria-label="説明"
              className={styles.info}
              type="button"
            >
              <MdInfoOutline size={18} />
            </button>
            {explained ? (
              <p className={styles.tooltip} id={noteId} role="tooltip">
                選んだサイトは先読みの回を、それ以外は無料の最新話を開きます。
              </p>
            ) : null}
          </div>
        </div>
        <ul className={styles.grid}>
          {sites.map((site) => {
            const early = hydrated && earlySites.isEarly(site.url);

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
