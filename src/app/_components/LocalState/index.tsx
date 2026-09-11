"use client";
import { FavoritesContext, useFavoritesState } from "@/app/useFavorites";
import { OpenedContext, useOpenedState } from "@/app/useOpened";

export type LocalStateProps = {
  children: React.ReactNode;
};

/**
 * 手元に持っている登録と既読を、画面ぜんぶで1つずつにする。
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

  return (
    <FavoritesContext.Provider value={favorites}>
      <OpenedContext.Provider value={opened}>{children}</OpenedContext.Provider>
    </FavoritesContext.Provider>
  );
}
