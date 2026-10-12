"use client";
import { createContext, useContext } from "react";
import type authClient from "@/app/authClient";

export type AccountSession = {
  data: ReturnType<typeof authClient.useSession>["data"];
  /**
   * 聞きに行っているあいだは true。このあいだ data はログイン中でも null になる。
   * そこで「ログインしていない」と判断すると、合流の控えを消したり、押したぶんを送り損ねたりする
   */
  isPending: boolean;
};

/** 画面が組み上がるまでは、誰が見ているか分からない */
export const pendingSession: AccountSession = { data: null, isPending: true };

export const AccountSessionContext =
  createContext<AccountSession>(pendingSession);

/**
 * 今のセッション。値を持っているのは AccountSession の1か所だけ。
 * ログインしたことの無い端末では、聞きに行かずに「ログインしていない」を返す
 */
export default function useAccountSession(): AccountSession {
  return useContext(AccountSessionContext);
}
