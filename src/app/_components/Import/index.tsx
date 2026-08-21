"use client";
import { useEffect, useState } from "react";
import ReceiveFavorites from "../ReceiveFavorites";
import styles from "./style.module.css";

/**
 * 渡されたリンクの行き先。中身は URL の断片に載っているので、
 * 読み取りは描画後になる。断片が無ければ、この画面で受け取る。
 */
export default function Import(): React.JSX.Element {
  const [encoded, setEncoded] = useState<null | string | undefined>(undefined);

  useEffect(() => {
    setEncoded(location.hash.slice(1));
  }, []);

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>お気に入りを受信</h2>
      <div className={styles.body}>
        {encoded === undefined ? null : (
          <ReceiveFavorites initialEncoded={encoded} />
        )}
      </div>
    </div>
  );
}
