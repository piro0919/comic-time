"use client";
import { useCallback, useMemo } from "react";
import { useLocalStorage } from "usehooks-ts";

/**
 * 追いかける対象は作品とサイトの2種類。
 * 作品は更新曜日が決まっているので、曜日ごとに登録させる必要はない。
 * 「このサイトは全部見る」という追い方もあるため、サイトも登録できるようにする。
 *
 * 作品は題名から作った見出しで持つ。サイトによっては作品のURLが話ごとに変わり、
 * URLで持つと登録した回が流れた時点で追えなくなるため。
 * 以前の登録はURLのまま入っているので、どちらでも当たるようにしてある。
 */
export const key = "favorites-v3";

type Stored = {
  sites: string[];
  works: string[];
};

export type Favorites = {
  /** 昔のURLでの登録を、作品の見出しでの登録に置き換える */
  adoptTitle: (workKey: string, urls: string[]) => void;
  followsSite: (siteUrl: string) => boolean;
  /** 作品の見出しか、載っているどれかのURLが入っていれば登録済み */
  hasWork: (workKey: string, urls: string[]) => boolean;
  /** 受け取った登録で丸ごと書き換える。画面の件数もここを通せば追いつく */
  replaceAll: (next: Stored) => void;
  siteUrls: string[];
  toggleSite: (siteUrl: string) => void;
  /** 入れるときは作品の見出しで。外すときは昔のURLぶんも一緒に落とす */
  toggleWork: (workKey: string, urls: string[]) => void;
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
    adoptTitle: useCallback(
      (workKey, urls) => {
        setStored((prev) => {
          const legacy = prev.works.filter((entry) => urls.includes(entry));

          if (legacy.length === 0 || prev.works.includes(workKey)) {
            return prev;
          }

          return {
            ...prev,
            works: [
              ...prev.works.filter((entry) => !urls.includes(entry)),
              workKey,
            ],
          };
        });
      },
      [setStored],
    ),
    followsSite: useCallback((siteUrl) => siteSet.has(siteUrl), [siteSet]),
    hasWork: useCallback(
      (workKey, urls) =>
        workSet.has(workKey) || urls.some((url) => workSet.has(url)),
      [workSet],
    ),
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
      (workKey, urls) => {
        setStored((prev) => {
          const added =
            prev.works.includes(workKey) ||
            urls.some((url) => prev.works.includes(url));
          const rest = prev.works.filter(
            (entry) => entry !== workKey && !urls.includes(entry),
          );

          return { ...prev, works: added ? rest : [...rest, workKey] };
        });
      },
      [setStored],
    ),
    workUrls: stored.works,
  };
}
