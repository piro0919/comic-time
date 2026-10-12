"use client";
import { createAuthClient } from "better-auth/react";

/**
 * ログインの窓口。ログインは任意なので、ここを一度も呼ばなくてもサイトは動く。
 * 入り口は Google だけにしている。
 *
 * セッションは authClient.useSession を直に呼ばず、useAccountSession から読む。
 * 直に呼ぶと、ログインしたことの無い人でも開くたびにサーバーへ聞きに行く。
 */
const authClient = createAuthClient();

export default authClient;

/**
 * この端末でログインしたことがある印。印の無い端末（ほとんどの人）はセッションを聞きに行かない。
 * 聞きに行くと、ログインしていない人でも画面を開くたびにサーバーの関数が1回動く。
 */
const hintKey = "signed-in-v1";

/**
 * 印を入れる前からログインしていた端末の見分け。AccountSync が初回の合流のあとに付ける控えで、
 * ログイン中の端末にはこれが残っている。印だけを見ると、その人たちが黙ってログアウトして見える
 */
export const syncedKey = "favorites-synced-v1";

export function hasSignInHint(): boolean {
  try {
    return (
      localStorage.getItem(hintKey) !== null ||
      localStorage.getItem(syncedKey) !== null
    );
  } catch {
    return false;
  }
}

export function setSignInHint(on: boolean): void {
  try {
    if (on) {
      localStorage.setItem(hintKey, "1");
    } else {
      localStorage.removeItem(hintKey);
    }
  } catch {
    // 残せない端末では、ログインしても入り口のボタンのまま。保存を止めたブラウザだけで起きる
  }
}

/** Google でログインする。戻ってきたときに聞きに行けるよう、先に印を付ける */
export function signIn(): void {
  setSignInHint(true);
  void authClient.signIn.social({ provider: "google" });
}

export async function signOut(): Promise<void> {
  await authClient.signOut();
  setSignInHint(false);
}

/**
 * アカウントと預かった情報を消す。
 * ログインから時間がたったセッションでは断られる（stale）。その場合はログインし直してもらう
 */
export async function deleteAccount(): Promise<"deleted" | "failed" | "stale"> {
  const { error } = await authClient.deleteUser();

  if (error === null) {
    setSignInHint(false);

    try {
      localStorage.removeItem(syncedKey);
    } catch {
      // 控えが残っても、次に開いたときにセッションが無いと分かって消える
    }

    return "deleted";
  }

  return error.code === "SESSION_EXPIRED" ? "stale" : "failed";
}
