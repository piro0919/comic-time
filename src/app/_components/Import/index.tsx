"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MdQrCodeScanner } from "react-icons/md";
import { toast } from "sonner";
import readReceived from "@/app/readReceived";
import {
  decodeFavorites,
  mergeFavorites,
  type SharedFavorites,
} from "@/app/shareLink";
import useFavorites from "@/app/useFavorites";
import QrCamera from "../QrCamera";
import styles from "./style.module.css";

type State =
  | { kind: "empty" }
  | { kind: "loading" }
  | { kind: "ready"; received: SharedFavorites }
  | { kind: "unreadable" };

/**
 * 別の端末から渡されたお気に入りを取り込む。
 * 中身は URL の断片に載っているので、読み取りは描画後になる。
 * 断片が付いていないときは、この画面で QR か住所を受け取る。
 */
export default function Import(): React.JSX.Element {
  const router = useRouter();
  const favorites = useFavorites();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [pasted, setPasted] = useState("");
  const [scanning, setScanning] = useState(false);
  const read = useCallback(async (encoded: string): Promise<void> => {
    const received = await decodeFavorites(encoded);

    setState(
      received === null || received.works.length + received.sites.length === 0
        ? { kind: "unreadable" }
        : { kind: "ready", received },
    );
  }, []);

  useEffect(() => {
    const encoded = location.hash.slice(1);

    if (encoded === "") {
      setState({ kind: "empty" });

      return;
    }

    void read(encoded);
  }, [read]);

  /** 読み取った文字列を引き受ける。短縮された住所は開いて確かめる */
  const accept = useCallback(
    (text: string): void => {
      const result = readReceived(text);

      setScanning(false);

      if (result.kind === "url") {
        location.href = result.url;

        return;
      }

      if (result.kind === "unreadable") {
        toast.error("読み取れませんでした");

        return;
      }

      setState({ kind: "loading" });
      void read(result.encoded);
    },
    [read],
  );
  const apply = (received: SharedFavorites, keepExisting: boolean): void => {
    const current = { sites: favorites.siteUrls, works: favorites.workUrls };
    const next = keepExisting ? mergeFavorites(current, received) : received;
    const count = received.works.length + received.sites.length;

    favorites.replaceAll(next);
    toast.success(
      keepExisting ? `${count}件を追加しました` : `${count}件と入れ替えました`,
    );
    // 断片を残したまま戻ると、開き直すたびに同じ確認が出る
    router.replace("/favorites");
  };

  if (state.kind === "loading") {
    return <div className={styles.container} />;
  }

  if (state.kind === "empty") {
    return (
      <div className={styles.container}>
        <h2 className={styles.heading}>お気に入りを受け取る</h2>
        <p className={styles.description}>
          渡す端末で共有を押すと、QRとリンクが出ます。それをここで読み取ります。
        </p>
        {scanning ? (
          <QrCamera
            onClose={() => {
              setScanning(false);
            }}
            onRead={accept}
          />
        ) : (
          <button
            onClick={() => {
              setScanning(true);
            }}
            className={styles.button}
            type="button"
          >
            <MdQrCodeScanner size={18} />
            カメラで読み取る
          </button>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            accept(pasted);
          }}
          className={styles.paste}
        >
          <input
            onChange={(event) => {
              setPasted(event.target.value);
            }}
            aria-label="渡されたリンク"
            className={styles.input}
            inputMode="url"
            placeholder="リンクを貼り付ける"
            type="text"
            value={pasted}
          />
          <button
            className={styles.secondary}
            disabled={pasted.trim() === ""}
            type="submit"
          >
            読み取る
          </button>
        </form>
      </div>
    );
  }

  if (state.kind === "unreadable") {
    return (
      <div className={styles.container}>
        <h2 className={styles.heading}>読み取れませんでした</h2>
        <p className={styles.description}>
          リンクが途中で切れている可能性があります。渡した端末で作り直してください。
        </p>
        <button
          onClick={() => {
            setState({ kind: "empty" });
          }}
          className={styles.button}
          type="button"
        >
          もう一度読み取る
        </button>
      </div>
    );
  }

  const current = favorites.workUrls.length + favorites.siteUrls.length;
  const received = state.received.works.length + state.received.sites.length;

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>お気に入りを共有</h2>
      <div className={styles.actions}>
        <button
          onClick={() => {
            apply(state.received, true);
          }}
          className={styles.button}
          type="button"
        >
          {received}件を追加
        </button>
        {current === 0 ? null : (
          <button
            onClick={() => {
              apply(state.received, false);
            }}
            className={styles.secondary}
            type="button"
          >
            {received}件と入れ替え
          </button>
        )}
      </div>
    </div>
  );
}
