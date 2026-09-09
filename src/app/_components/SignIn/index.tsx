"use client";
import { useCallback } from "react";
import { MdLogin, MdLogout } from "react-icons/md";
import authClient from "@/app/authClient";
import styles from "./style.module.css";

/**
 * ログインの出入り口。ログインは任意で、押さなければ今までどおり端末の中だけで動く。
 * 入るとフォローが端末をまたいで揃う。
 */
export default function SignIn(): React.JSX.Element {
  const { data: session, isPending } = authClient.useSession();
  const signIn = useCallback(() => {
    void authClient.signIn.social({ provider: "google" });
  }, []);
  const signOut = useCallback(() => {
    void authClient.signOut();
  }, []);

  // 読み込み中に入り口を出すと、すでに入っている人の画面で一瞬ちらつく
  if (isPending) {
    return <span className={styles.placeholder} />;
  }

  return session === null ? (
    <button
      aria-label="Googleでログイン"
      className={styles.button}
      onClick={signIn}
      type="button"
    >
      <MdLogin size={24} />
    </button>
  ) : (
    <button
      aria-label="ログアウト"
      className={styles.button}
      onClick={signOut}
      type="button"
    >
      <MdLogout size={24} />
    </button>
  );
}
