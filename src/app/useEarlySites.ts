"use client";
import { createContext, useCallback, useContext, useMemo } from "react";
import { useLocalStorage } from "usehooks-ts";
import authClient from "@/app/authClient";
import { setEarlySite } from "@/app/earlySites";

/**
 * 先読みの回を開くサイト。会員になっていて先読みまで読めるサイトだけを入れる。
 *
 * 入っていないサイトのカードは、無料で読める最新の回へ送る。取得が拾うのはその日に
 * 出た回で、それが先読みだと、会員でない人は開いても読めない。
 *
 * ログインしているあいだは、押すたびにサーバーへも書く。手元はその写しになる。
 */
const key = "early-sites-v1";

export type EarlySites = {
  isEarly: (siteUrl: string) => boolean;
  /** 受け取った一覧で丸ごと書き換える。ログインしたときの取り込みで使う */
  replaceAll: (next: string[]) => void;
  siteUrls: string[];
  toggle: (siteUrl: string) => void;
};

/**
 * 読み書きの本体。呼ぶのは LocalState だけ。
 * 理由は useFavorites と同じで、カードごとに購読を持たせない。
 */
export function useEarlySitesState(): EarlySites {
  const { data: session, isPending } = authClient.useSession();
  // 確かめている間に押したぶんも送る。ログインしていなければサーバーが何もせず返す
  const signedIn = session !== null || isPending;
  // サーバ側では空になるため、読み出しは描画後にする（表示のズレを避ける）
  const [siteUrls, setSiteUrls] = useLocalStorage<string[]>(key, [], {
    initializeWithValue: false,
  });
  const siteSet = useMemo(() => new Set(siteUrls), [siteUrls]);
  const isEarly: EarlySites["isEarly"] = useCallback(
    (siteUrl) => siteSet.has(siteUrl),
    [siteSet],
  );
  const replaceAll: EarlySites["replaceAll"] = useCallback(
    (next) => {
      setSiteUrls(next);
    },
    [setSiteUrls],
  );
  const toggle: EarlySites["toggle"] = useCallback(
    (siteUrl) => {
      const early = !siteSet.has(siteUrl);

      if (signedIn) {
        void setEarlySite(siteUrl, early);
      }

      setSiteUrls((prev) =>
        early
          ? [...prev.filter((entry) => entry !== siteUrl), siteUrl]
          : prev.filter((entry) => entry !== siteUrl),
      );
    },
    [setSiteUrls, signedIn, siteSet],
  );

  // 返すものを固定する。包まないと、これを依存に置いた useMemo が効かない
  return useMemo(
    () => ({ isEarly, replaceAll, siteUrls, toggle }),
    [isEarly, replaceAll, siteUrls, toggle],
  );
}

/** Provider を置き忘れた場所で呼ぶと気付けるよう、既定は入れない */
export const EarlySitesContext = createContext<EarlySites | null>(null);

export default function useEarlySites(): EarlySites {
  const value = useContext(EarlySitesContext);

  if (value === null) {
    throw new Error("EarlySitesProvider の中で使ってください");
  }

  return value;
}
