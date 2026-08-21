import { type Metadata } from "next";
import Link from "next/link";
import styles from "./style.module.css";

export const metadata: Metadata = {
  description: "インターネットに接続されていないときに表示されるページです。",
  robots: { follow: false, index: false },
  title: "オフライン",
};

/**
 * 圏外で、まだ一度も開いていないページを開いたときの受け皿。
 * Service Worker が控えを持っていない場合にここへ差し替わる。
 */
export default function Page(): React.JSX.Element {
  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>インターネットに接続されていません</h2>
      <p className={styles.description}>
        このページは保存されていないため、オフラインでは表示できません。
        接続を確認してから、もう一度お試しください。
      </p>
      <Link className={styles.button} href="/">
        再試行
      </Link>
    </div>
  );
}
