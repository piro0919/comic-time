"use client";
import { useCallback, useSyncExternalStore } from "react";
import { key } from "./useFavorites";

/**
 * 登録が1件でもあるか。有無だけを、描く前に答える。
 *
 * useFavorites を待つと間に合わない。あれは組み上がった後の効果で localStorage を
 * 読むので、その一瞬だけ「登録が無い」と見える。クッキーで消したちらつきが
 * 90ms だけ戻ってくる。ここは useIsHydrated と同じ useSyncExternalStore を使い、
 * サーバー側の答えにクッキーの印を渡して、ブラウザ側では localStorage を直に読む。
 *
 * 読むのは同じ鍵の同じ形。登録の中身を扱うのは今までどおり useFavorites だけで、
 * ここが答えるのは「あるか」の一語に限る。
 */
type Stored = { works?: string[] };

function read(): boolean {
  try {
    const raw = localStorage.getItem(key);

    if (raw === null) {
      return false;
    }

    return ((JSON.parse(raw) as Stored).works ?? []).length > 0;
  } catch {
    return false;
  }
}

/** usehooks-ts は書き込みのたびに local-storage を投げる。別のタブは storage で届く */
function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener("local-storage", onChange);

  return (): void => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("local-storage", onChange);
  };
}

export default function useHasFavorites(
  /** クッキーに付いていた印。組み上がるまではこれを答える */
  fallback: boolean,
): boolean {
  const getServerSnapshot = useCallback((): boolean => fallback, [fallback]);

  return useSyncExternalStore(subscribe, read, getServerSnapshot);
}
