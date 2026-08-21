"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<"receive" | "send" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
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
    if (mode !== "send" || count === 0) {
      return;
    }

    setLink(null);
    void build();
  }, [count, mode, build]);

  // メニューは、外を触るか Esc で閉じる
  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const onPointerDown = (event: MouseEvent | TouchEvent): void => {
      if (!(event.target instanceof Node) || menuRef.current === null) {
        return;
      }

      if (!menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return (): void => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

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
      <div className={styles.menuAnchor} ref={menuRef}>
        <button
          onClick={() => {
            setMenuOpen((open) => !open);
          }}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label="お気に入りを共有"
          className={styles.open}
          title="お気に入りを共有"
          type="button"
        >
          <MdIosShare size={18} />
        </button>
        {menuOpen ? (
          <div className={styles.menu} role="menu">
            <button
              onClick={() => {
                setMenuOpen(false);
                setMode("send");
              }}
              className={styles.menuItem}
              role="menuitem"
              type="button"
            >
              このデバイスから送信
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                setMode("receive");
              }}
              className={styles.menuItem}
              role="menuitem"
              type="button"
            >
              別のデバイスから受信
            </button>
          </div>
        ) : null}
      </div>
      {mode === null
        ? null
        : createPortal(
            <div
              onClick={() => {
                setMode(null);
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
                  <span className={styles.title}>
                    {mode === "receive"
                      ? "お気に入りを受信"
                      : "お気に入りを送信"}
                  </span>
                  <button
                    onClick={() => {
                      setMode(null);
                    }}
                    aria-label="閉じる"
                    className={styles.close}
                    type="button"
                  >
                    <MdClose size={20} />
                  </button>
                </div>
                {mode === "receive" ? (
                  <ReceiveFavorites
                    onDone={() => {
                      setMode(null);
                    }}
                  />
                ) : count === 0 ? (
                  <p className={styles.note}>
                    送信できるお気に入りがありません。作品の星を選択して追加してください。
                  </p>
                ) : link === null ? (
                  <p className={styles.note}>リンクを作成しています…</p>
                ) : (
                  <>
                    {qrValue === null ? (
                      /* 短縮が返るまでQRの可否は決まらない。先に断らない */
                      <p className={styles.note}>
                        {link.shortening
                          ? "リンクを作成しています…"
                          : "お気に入りが多いため、QR コードを作成できません。下のリンクを送信してください。"}
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
                              ? "短縮リンクを作成できませんでした"
                              : "短縮リンクをコピーします"
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
          )}
    </>
  );
}
