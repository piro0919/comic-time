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
  hasWork: (url: string) => boolean;
  siteUrls: string[];
  toggleSite: (siteUrl: string) => void;
  toggleWork: (url: string) => void;
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
    hasWork: useCallback((url) => workSet.has(url), [workSet]),
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
    workUrls: stored.works,
  };
}
