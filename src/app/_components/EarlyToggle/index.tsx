"use client";
import useEarlySites from "@/app/useEarlySites";
import styles from "./style.module.css";

export type EarlyToggleProps = {
  siteUrl: string;
};

/**
 * そのサイトで先読みの回を開くかどうか。会員で先読みまで読める人のための切り替え。
 * 入れていなければ、カードからは無料で読める最新の回へ送る。
 */
export default function EarlyToggle({
  siteUrl,
}: EarlyToggleProps): React.JSX.Element {
  const earlySites = useEarlySites();

  return (
    <label className={styles.toggle}>
      <input
        onChange={() => {
          earlySites.toggle(siteUrl);
        }}
        checked={earlySites.isEarly(siteUrl)}
        className={styles.input}
        type="checkbox"
      />
      <span className={styles.text}>
        <span className={styles.label}>先読みの回を開く</span>
        <span className={styles.note}>
          会員で先読みまで読めるときに入れます。入れていないと、無料で読める最新の回を開きます。
        </span>
      </span>
    </label>
  );
}
