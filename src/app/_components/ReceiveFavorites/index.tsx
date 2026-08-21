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

export type ReceiveFavoritesProps = {
  /** リンクの断片から開かれたときの中身 */
  initialEncoded?: null | string;
  /** 取り込みを終えたときの後始末。渡さなければお気に入りへ移る */
  onDone?: () => void;
};

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; received: SharedFavorites }
  | { kind: "unreadable" };

/**
 * 別の端末からお気に入りを受け取る。
 * QRをカメラで読むか、リンクを貼り付けるかの2通り。
 * 短縮されたリンクは中身が分からないので、開いて確かめる。
 */
export default function ReceiveFavorites({
  initialEncoded,
  onDone,
}: ReceiveFavoritesProps): React.JSX.Element {
  const router = useRouter();
  const favorites = useFavorites();
  const [state, setState] = useState<State>(() =>
    initialEncoded === undefined || initialEncoded === null
      ? { kind: "idle" }
      : { kind: "loading" },
  );
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
    if (
      initialEncoded === undefined ||
      initialEncoded === null ||
      initialEncoded === ""
    ) {
      return;
    }

    setState({ kind: "loading" });
    void read(initialEncoded);
  }, [initialEncoded, read]);

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

    if (onDone !== undefined) {
      onDone();

      return;
    }

    // 断片を残したまま戻ると、開き直すたびに同じ確認が出る
    router.replace("/favorites");
  };

  if (state.kind === "loading") {
    return <p className={styles.note}>読み取っています…</p>;
  }

  if (state.kind === "unreadable") {
    return (
      <div className={styles.container}>
        <p className={styles.note}>
          読み取れませんでした。リンクが途中で切れている可能性があります。
        </p>
        <button
          onClick={() => {
            setState({ kind: "idle" });
          }}
          className={styles.secondary}
          type="button"
        >
          もう一度読み取る
        </button>
      </div>
    );
  }

  if (state.kind === "ready") {
    const current = favorites.workUrls.length + favorites.siteUrls.length;
    const received = state.received.works.length + state.received.sites.length;

    return (
      <div className={styles.container}>
        <p className={styles.note}>{received}件を受け取りました。</p>
        <div className={styles.actions}>
          <button
            onClick={() => {
              apply(state.received, true);
            }}
            className={styles.primary}
            type="button"
          >
            今の登録に追加
          </button>
          {current === 0 ? null : (
            <button
              onClick={() => {
                apply(state.received, false);
              }}
              className={styles.secondary}
              type="button"
            >
              入れ替える
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {scanning ? (
        <QrCamera
          onClose={() => {
            setScanning(false);
          }}
          onRead={accept}
        />
      ) : (
        <>
          <p className={styles.note}>
            渡す端末で共有を開くと、QRとリンクが出ます。
          </p>
          <button
            onClick={() => {
              setScanning(true);
            }}
            className={styles.primary}
            type="button"
          >
            <MdQrCodeScanner size={16} />
            カメラで読み取る
          </button>
        </>
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
