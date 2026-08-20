"use client";
import { useCallback, useMemo } from "react";
import { useLocalStorage } from "usehooks-ts";

/**
 * 追いかける対象は作品とサイトの2種類。
 * 作品は更新曜日が決まっているので、曜日ごとに登録させる必要はない。
 * 「このサイトは全部見る」という追い方もあるため、サイトも登録できるようにする。
 */
export const key = "favorites-v3";

type Stored = {
  sites: string[];
  works: string[];
};

export type Favorites = {
  followsSite: (siteUrl: string) => boolean;
  /** 同じ作品が複数サイトにあるとき、どれか1つ入っていれば登録済みとみなす */
  hasAnyWork: (urls: string[]) => boolean;
  hasWork: (url: string) => boolean;
  /** 受け取った登録で丸ごと書き換える。画面の件数もここを通せば追いつく */
  replaceAll: (next: Stored) => void;
  siteUrls: string[];
  toggleSite: (siteUrl: string) => void;
  toggleWork: (url: string) => void;
  /**
   * 入れるときは先頭の1つだけ。外すときは渡されたぶんを全部。
   * 判定は hasAnyWork でまとめて見るので、全部持たなくても追いつく
   */
  toggleWorks: (urls: string[]) => void;
  workUrls: string[];
};

function toggle(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

/** 描画前に登録の有無だけ知りたいときに使う */
export function storedWorkUrls(): string[] {
  try {
    const raw = localStorage.getItem(key);

    return raw === null ? [] : ((JSON.parse(raw) as Stored).works ?? []);
  } catch {
    return [];
  }
}

export default function useFavorites(): Favorites {
  // サーバ側では空になるため、読み出しは描画後にする（表示のズレを避ける）
  const [stored, setStored] = useLocalStorage<Stored>(
    key,
    { sites: [], works: [] },
    { initializeWithValue: false },
  );
  const workSet = useMemo(() => new Set(stored.works), [stored.works]);
  const siteSet = useMemo(() => new Set(stored.sites), [stored.sites]);

  return {
    followsSite: useCallback((siteUrl) => siteSet.has(siteUrl), [siteSet]),
    hasAnyWork: useCallback(
      (urls) => urls.some((url) => workSet.has(url)),
      [workSet],
    ),
    hasWork: useCallback((url) => workSet.has(url), [workSet]),
    replaceAll: useCallback(
      (next) => {
        setStored(next);
      },
      [setStored],
    ),
    siteUrls: stored.sites,
    toggleSite: useCallback(
      (siteUrl) => {
        setStored((prev) => ({ ...prev, sites: toggle(prev.sites, siteUrl) }));
      },
      [setStored],
    ),
    toggleWork: useCallback(
      (url) => {
        setStored((prev) => ({ ...prev, works: toggle(prev.works, url) }));
      },
      [setStored],
    ),
    toggleWorks: useCallback(
      (urls) => {
        setStored((prev) => {
          const added = urls.some((url) => prev.works.includes(url));
          const rest = prev.works.filter((url) => !urls.includes(url));

          return { ...prev, works: added ? rest : [...rest, urls[0]] };
        });
      },
      [setStored],
    ),
    workUrls: stored.works,
  };
}
