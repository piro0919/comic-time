import { type Metadata } from "next";
import Link from "next/link";
import styles from "./style.module.css";

export const metadata: Metadata = {
  description: "通信が切れているときに出る画面です。",
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
      <h2 className={styles.heading}>つながっていません</h2>
      <p className={styles.description}>
        このページはまだ端末に控えていないため、いま出せません。
        電波の届く場所でもう一度開いてください。
      </p>
      <Link className={styles.button} href="/">
        もう一度試す
      </Link>
    </div>
  );
}
