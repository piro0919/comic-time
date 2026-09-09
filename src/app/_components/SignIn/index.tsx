"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { MdLogin } from "react-icons/md";
import authClient from "@/app/authClient";
import styles from "./style.module.css";

/**
 * ログインの出入り口。ログインは任意で、押さなければ今までどおり端末の中だけで動く。
 * 入るとフォローが端末をまたいで揃う。
 *
 * 入っているあいだは Google の顔写真を出す。入口と出口を似たアイコンで描き分けると、
 * どちらの状態なのか読み取れず、入るつもりで出てしまう。顔が出ていれば、
 * 入っていることと、誰として入っているかが同時に分かる。
 */
export default function SignIn(): React.JSX.Element {
  const { data: session, isPending } = authClient.useSession();
  // サーバー側では誰が見ているか分からない。組み上がるまでは同じものを描く
  const [isMounted, setIsMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent): void => {
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

  const signIn = useCallback(() => {
    void authClient.signIn.social({ provider: "google" });
  }, []);
  const signOut = useCallback(() => {
    setMenuOpen(false);
    void authClient.signOut();
  }, []);

  // 決まる前に入り口を出すと、すでに入っている人の画面で一瞬ちらつく
  if (!isMounted || isPending) {
    return <span className={styles.placeholder} />;
  }

  if (session === null) {
    return (
      <button
        aria-label="Googleでログイン"
        className={styles.button}
        onClick={signIn}
        type="button"
      >
        <MdLogin size={24} />
      </button>
    );
  }

  const { email, image, name } = session.user;

  return (
    <div className={styles.menuAnchor} ref={menuRef}>
      <button
        aria-expanded={menuOpen}
        aria-label={`${name}としてログイン中`}
        className={styles.avatarButton}
        onClick={() => setMenuOpen((open) => !open)}
        type="button"
      >
        {/* 写真を出していない人もいる。その場合は名前の頭文字で代える */}
        {image === null || image === undefined ? (
          <span className={styles.initial}>{[...name][0] ?? "?"}</span>
        ) : (
          <Image
            alt=""
            className={styles.avatar}
            height={28}
            src={image}
            unoptimized={true}
            width={28}
          />
        )}
      </button>
      {menuOpen ? (
        <div className={styles.menu}>
          <p className={styles.account}>
            <span className={styles.name}>{name}</span>
            <span className={styles.email}>{email}</span>
          </p>
          <button className={styles.menuItem} onClick={signOut} type="button">
            ログアウト
          </button>
        </div>
      ) : null}
    </div>
  );
}
