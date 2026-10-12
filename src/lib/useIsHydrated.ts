"use client";
import { useSyncExternalStore } from "react";

/**
 * 画面が組み上がったかどうか。サーバー側では false、ブラウザで組み上がった後は true。
 *
 * 端末の設定・時計・ブラウザの種類は、サーバー側では分からない。だからといって
 * useEffect で state を立てると、描いた直後にもう一度描き直すことになる。
 * React はこの用途に useSyncExternalStore を用意していて、サーバー側の値を別に渡せる。
 *
 * 値は変わらないので、購読は何もしない。3つとも同じ関数を使い回して、
 * 描き直しのたびに別物として扱われないようにする。
 */
const subscribe = (): (() => void) => (): void => undefined;
const getSnapshot = (): boolean => true;
const getServerSnapshot = (): boolean => false;

export default function useIsHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
