"use client";
import { track } from "@vercel/analytics";
import { useEffect } from "react";
import favoritesKey from "@/app/favoritesKey";
import { favoritesVisitEvent } from "@/app/funnelEvents";
import { EarlySitesContext, useEarlySitesState } from "@/app/useEarlySites";
import { FavoritesContext, useFavoritesState } from "@/app/useFavorites";
import { OpenedContext, useOpenedState } from "@/app/useOpened";

export type LocalStateProps = {
  children: React.ReactNode;
};

/** 同じタブで2度送らないための印。タブを閉じれば消える */
const visitSentKey = "favorites-visit-sent";

/**
 * お気に入りのある端末がサイトを開いたら、1つのタブで1回だけ数える。
 *
 * 見るのは開いた時点の登録だけ。useFavoritesState の値を見ると、
 * 初めて登録したその場でも送ってしまい、戻ってきた人と区別できない。
 */
function countReturnVisit(): void {
  try {
    if (sessionStorage.getItem(visitSentKey) !== null) {
      return;
    }

    const stored = JSON.parse(
      localStorage.getItem(favoritesKey) ?? "null",
    ) as null | {
      sites?: string[];
      works?: string[];
    };
    const works = stored?.works?.length ?? 0;
    const sites = stored?.sites?.length ?? 0;

    if (works + sites === 0) {
      return;
    }

    /*
     * 開いた直後は <Analytics /> がまだ window.va を用意しておらず、
     * track は黙って捨てる。ライブラリと同じ待ち行列を先に置けば、
     * 後から読み込まれた計測の本体がまとめて送る
     */
    window.va ??= (event, properties): void => {
      window.vaq ??= [];
      window.vaq.push([event, properties]);
    };

    sessionStorage.setItem(visitSentKey, "1");
    track(favoritesVisitEvent, { sites, works });
  } catch {
    // 読めない端末では数えない。画面には関わらない
  }
}

/**
 * 手元に持っている登録と既読と先読みの設定を、画面ぜんぶで1つずつにする。
 *
 * 以前はカードが自分で useFavorites と useOpened を呼んでいた。あれは1枚ごとに
 * localStorage の購読を作るので、一覧に400枚並ぶと購読が千を超える。
 * 誰かが1回書くとその全員が読み直すため、開いただけで localStorage を19万回読み、
 * 385MBぶんの文字列を解析していた。登録が300件あると数GBまで膨らみ、
 * iOS のホーム画面アプリはそこでメモリ切れになって落ちる。
 *
 * ここで1つだけ持ち、カードには読むだけの値を配る。
 */
export default function LocalState({
  children,
}: LocalStateProps): React.JSX.Element {
  const favorites = useFavoritesState();
  const opened = useOpenedState();
  const earlySites = useEarlySitesState();

  useEffect(countReturnVisit, []);

  return (
    <FavoritesContext.Provider value={favorites}>
      <OpenedContext.Provider value={opened}>
        <EarlySitesContext.Provider value={earlySites}>
          {children}
        </EarlySitesContext.Provider>
      </OpenedContext.Provider>
    </FavoritesContext.Provider>
  );
}
