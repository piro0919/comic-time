"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MdClose, MdIosShare } from "react-icons/md";
import {
  encodeFavorites,
  maxShortenableLength,
  type SharedFavorites,
} from "@/app/shareLink";
import useFavorites from "@/app/useFavorites";
import ReceiveFavorites from "../ReceiveFavorites";
import styles from "./style.module.css";

const QRCodeSVG = dynamic(
  async () => (await import("qrcode.react")).QRCodeSVG,
  { ssr: false },
);
/** QRとして無理なく読める長さ。これを超えたらQRは出さない */
const maxQrLength = 900;

type Link = {
  long: string;
  short: null | string;
  /** 短縮を頼んでいる最中。返るまでQRの可否は決まらない */
  shortening: boolean;
};

/**
 * 別の端末へお気に入りを渡す。
 * 中身はリンクの断片に載せる。短縮できたときはQRも出す。
 */
export default function ShareFavorites(): null | React.JSX.Element {
  const favorites = useFavorites();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"receive" | "send">("send");
  const [link, setLink] = useState<Link | null>(null);
  const [copied, setCopied] = useState<null | string>(null);
  const count = favorites.workUrls.length + favorites.siteUrls.length;
  const build = useCallback(async (): Promise<void> => {
    const shared: SharedFavorites = {
      sites: favorites.siteUrls,
      works: favorites.workUrls,
    };
    const long = `${location.origin}/import#${await encodeFavorites(shared)}`;

    if (long.length > maxShortenableLength) {
      setLink({ long, short: null, shortening: false });

      return;
    }

    setLink({ long, short: null, shortening: true });

    const response = await fetch("/api/share", {
      body: JSON.stringify({ url: long }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }).catch(() => null);
    const result =
      response !== null && response.ok
        ? ((await response.json().catch(() => null)) as null | {
            shortUrl?: unknown;
          })
        : null;

    setLink({
      long,
      short: typeof result?.shortUrl === "string" ? result.shortUrl : null,
      shortening: false,
    });
  }, [favorites.siteUrls, favorites.workUrls]);

  useEffect(() => {
    if (!isOpen || mode !== "send" || count === 0) {
      return;
    }

    setLink(null);
    void build();
  }, [count, isOpen, mode, build]);

  const copy = async (value: string, label: string): Promise<void> => {
    await navigator.clipboard.writeText(value).catch(() => undefined);
    setCopied(label);
    setTimeout(() => setCopied(null), 1600);
  };
  /*
   * 短縮が返るまではQRを出さない。長い方で描いてから短い方へ描き直すと、
   * 読み取っている最中に絵柄が変わる。
   */
  const qrValue =
    link === null || link.shortening
      ? null
      : (link.short ?? (link.long.length <= maxQrLength ? link.long : null));

  return (
    <>
      <button
        onClick={() => {
          // 渡すものが無い端末は、受け取りに来ている
          setMode(count === 0 ? "receive" : "send");
          setIsOpen(true);
        }}
        aria-label="お気に入りを別の端末とやり取りする"
        className={styles.open}
        title="お気に入りを別の端末とやり取りする"
        type="button"
      >
        <MdIosShare size={18} />
      </button>
      {isOpen
        ? createPortal(
            <div
              onClick={() => {
                setIsOpen(false);
              }}
              className={styles.overlay}
              role="presentation"
            >
              <div
                onClick={(event) => {
                  // 中身を押しただけで閉じない
                  event.stopPropagation();
                }}
                className={styles.panel}
                role="presentation"
              >
                <div className={styles.head}>
                  <span className={styles.title}>お気に入りの受け渡し</span>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                    }}
                    aria-label="閉じる"
                    className={styles.close}
                    type="button"
                  >
                    <MdClose size={20} />
                  </button>
                </div>
                <select
                  onChange={(event) => {
                    setMode(
                      event.target.value === "receive" ? "receive" : "send",
                    );
                  }}
                  aria-label="渡すか受け取るかを選ぶ"
                  className={styles.mode}
                  value={mode}
                >
                  <option value="send">この端末から渡す</option>
                  <option value="receive">別の端末から受け取る</option>
                </select>
                {mode === "receive" ? (
                  <ReceiveFavorites
                    onDone={() => {
                      setIsOpen(false);
                    }}
                  />
                ) : count === 0 ? (
                  <p className={styles.note}>
                    渡せる登録がまだありません。作品の星を押すと渡せます。
                  </p>
                ) : link === null ? (
                  <p className={styles.note}>作成中です…</p>
                ) : (
                  <>
                    {qrValue === null ? (
                      /* 短縮が返るまでQRの可否は決まらない。先に断らない */
                      <p className={styles.note}>
                        {link.shortening
                          ? "作成中です…"
                          : "登録が多いため、QRは出せません。下のリンクを送ってください。"}
                      </p>
                    ) : (
                      <div className={styles.qr}>
                        <QRCodeSVG size={196} value={qrValue} />
                      </div>
                    )}
                    <div className={styles.links}>
                      <button
                        onClick={() => {
                          void copy(link.short ?? "", "short");
                        }}
                        title={
                          link.shortening
                            ? "短縮リンクを作成しています"
                            : link.short === null
                              ? "登録が多いか、短縮できなかったため使えません"
                              : "短い方のリンクをコピーする"
                        }
                        className={styles.copy}
                        disabled={link.short === null}
                        type="button"
                      >
                        {copied === "short"
                          ? "コピーしました"
                          : "短縮リンクをコピー"}
                      </button>
                      <button
                        onClick={() => {
                          void copy(link.long, "long");
                        }}
                        className={styles.copy}
                        type="button"
                      >
                        {copied === "long"
                          ? "コピーしました"
                          : "リンクをコピー"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
