"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  decodeFavorites,
  mergeFavorites,
  saveFavorites,
  type SharedFavorites,
} from "@/app/shareLink";
import useFavorites from "@/app/useFavorites";
import styles from "./style.module.css";

type State =
  | { count: number; kind: "done" }
  | { kind: "empty" }
  | { kind: "loading" }
  | { kind: "ready"; received: SharedFavorites }
  | { kind: "unreadable" };

/**
 * 別の端末から渡されたお気に入りを取り込む。
 * 中身は URL の断片に載っているので、読み取りは描画後になる。
 */
export default function Import(): React.JSX.Element {
  const router = useRouter();
  const favorites = useFavorites();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const encoded = location.hash.slice(1);

    if (encoded === "") {
      setState({ kind: "empty" });

      return;
    }

    void (async (): Promise<void> => {
      const received = await decodeFavorites(encoded);

      setState(
        received === null || received.works.length + received.sites.length === 0
          ? { kind: "unreadable" }
          : { kind: "ready", received },
      );
    })();
  }, []);

  const apply = (received: SharedFavorites, keepExisting: boolean): void => {
    const current = { sites: favorites.siteUrls, works: favorites.workUrls };
    const next = keepExisting ? mergeFavorites(current, received) : received;

    saveFavorites(next);
    setState({ count: next.works.length, kind: "done" });
  };

  if (state.kind === "loading") {
    return <div className={styles.container} />;
  }

  if (state.kind === "empty" || state.kind === "unreadable") {
    return (
      <div className={styles.container}>
        <h2 className={styles.heading}>読み取れませんでした</h2>
        <p className={styles.description}>
          リンクが途中で切れている可能性があります。渡した端末で作り直してください。
        </p>
        <button
          onClick={() => {
            router.push("/");
          }}
          className={styles.button}
          type="button"
        >
          最初の画面へ
        </button>
      </div>
    );
  }

  if (state.kind === "done") {
    return (
      <div className={styles.container}>
        <h2 className={styles.heading}>取り込みました</h2>
        <p className={styles.description}>
          この端末のお気に入りは{state.count}件になりました。
        </p>
        <button
          onClick={() => {
            // 断片を残したまま戻ると、開き直すたびに同じ確認が出る
            history.replaceState(null, "", "/favorites");
            router.push("/favorites");
            router.refresh();
          }}
          className={styles.button}
          type="button"
        >
          お気に入りを見る
        </button>
      </div>
    );
  }

  const current = favorites.workUrls.length + favorites.siteUrls.length;
  const received = state.received.works.length + state.received.sites.length;

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>お気に入りを取り込みますか</h2>
      <p className={styles.description}>
        受け取った登録は{received}件です。
        {current === 0
          ? "この端末にはまだ登録がありません。"
          : `この端末には今${current}件あります。`}
      </p>
      <div className={styles.actions}>
        <button
          onClick={() => {
            apply(state.received, true);
          }}
          className={styles.button}
          type="button"
        >
          今の登録に足す
        </button>
        {current === 0 ? null : (
          <button
            onClick={() => {
              apply(state.received, false);
            }}
            className={styles.secondary}
            type="button"
          >
            今の登録と入れ替える
          </button>
        )}
      </div>
    </div>
  );
}
