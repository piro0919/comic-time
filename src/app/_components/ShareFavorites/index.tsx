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
  tooLongToShorten: boolean;
};

/**
 * 別の端末へお気に入りを渡す。
 * 中身はリンクの断片に載せる。短縮できたときはQRも出す。
 */
export default function ShareFavorites(): null | React.JSX.Element {
  const favorites = useFavorites();
  const [isOpen, setIsOpen] = useState(false);
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
      setLink({ long, short: null, tooLongToShorten: true });

      return;
    }

    setLink({ long, short: null, tooLongToShorten: false });

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
      tooLongToShorten: false,
    });
  }, [favorites.siteUrls, favorites.workUrls]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setLink(null);
    void build();
  }, [isOpen, build]);

  const copy = async (value: string, label: string): Promise<void> => {
    await navigator.clipboard.writeText(value).catch(() => undefined);
    setCopied(label);
    setTimeout(() => setCopied(null), 1600);
  };
  const qrValue =
    link?.short ??
    (link !== null && link.long.length <= maxQrLength ? link.long : null);

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
        }}
        title={
          count === 0
            ? "作品の星を押して登録すると、別の端末へ渡せます"
            : "お気に入りを別の端末へ渡す"
        }
        aria-label="お気に入りを別の端末へ渡す"
        className={styles.open}
        disabled={count === 0}
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
                  <span className={styles.title}>お気に入りを共有</span>
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
                {link === null ? (
                  <p className={styles.note}>用意しています…</p>
                ) : (
                  <>
                    {qrValue === null ? (
                      <p className={styles.note}>
                        登録が多いため、QRは出せません。下のリンクを送ってください。
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
                          link.short === null
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
