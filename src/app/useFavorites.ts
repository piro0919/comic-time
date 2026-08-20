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
  /**
   * 登録した作品の題名。見出しはハッシュで題名に戻せず、
   * 7日より外の作品はサーバ側にも名前が無いため、手元に控える。
   * 共有リンクには載せない。短さを保つため、渡すのは見出しだけにする。
   */
  titles?: Record<string, string>;
  works: string[];
};

export type Favorites = {
  /** 昔の形での登録を、今の見出しでの登録に置き換える */
  adoptTitle: (workKey: string, legacyKeys: string[]) => void;
  followsSite: (siteUrl: string) => boolean;
  /** 今の見出しか、昔の形のどれかが入っていれば登録済み */
  hasWork: (workKey: string, legacyKeys: string[]) => boolean;
  /** 一覧に出てきた登録の題名を控える。すでに同じものがあれば何もしない */
  rememberTitle: (workKey: string, title: string) => void;
  /** 受け取った登録で丸ごと書き換える。画面の件数もここを通せば追いつく */
  replaceAll: (next: Stored) => void;
  siteUrls: string[];
  /** 控えてある題名。休眠中の作品を名前で出すために使う */
  titles: Record<string, string>;
  toggleSite: (siteUrl: string) => void;
  /** 入れるときは今の見出しで。外すときは昔の形のぶんも一緒に落とす */
  toggleWork: (workKey: string, legacyKeys: string[]) => void;
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
      (workKey, legacyKeys) => {
        setStored((prev) => {
          const legacy = prev.works.filter((entry) =>
            legacyKeys.includes(entry),
          );

          if (legacy.length === 0 || prev.works.includes(workKey)) {
            return prev;
          }

          return {
            ...prev,
            works: [
              ...prev.works.filter((entry) => !legacyKeys.includes(entry)),
              workKey,
            ],
          };
        });
      },
      [setStored],
    ),
    followsSite: useCallback((siteUrl) => siteSet.has(siteUrl), [siteSet]),
    hasWork: useCallback(
      (workKey, legacyKeys) =>
        workSet.has(workKey) || legacyKeys.some((entry) => workSet.has(entry)),
      [workSet],
    ),
    rememberTitle: useCallback(
      (workKey, title) => {
        setStored((prev) => {
          // 登録していないものの題名は控えない。控えても使い道がない
          if (!prev.works.includes(workKey)) {
            return prev;
          }

          const titles = prev.titles ?? {};

          if (titles[workKey] === title) {
            return prev;
          }

          return { ...prev, titles: { ...titles, [workKey]: title } };
        });
      },
      [setStored],
    ),
    replaceAll: useCallback(
      (next) => {
        setStored(next);
      },
      [setStored],
    ),
    siteUrls: stored.sites,
    titles: stored.titles ?? {},
    toggleSite: useCallback(
      (siteUrl) => {
        setStored((prev) => ({ ...prev, sites: toggle(prev.sites, siteUrl) }));
      },
      [setStored],
    ),
    toggleWork: useCallback(
      (workKey, legacyKeys) => {
        setStored((prev) => {
          const added =
            prev.works.includes(workKey) ||
            legacyKeys.some((entry) => prev.works.includes(entry));
          const rest = prev.works.filter(
            (entry) => entry !== workKey && !legacyKeys.includes(entry),
          );

          if (!added) {
            return { ...prev, works: [...rest, workKey] };
          }

          // 外したら題名の控えも捨てる。残しても増えるだけ
          const titles = { ...(prev.titles ?? {}) };

          delete titles[workKey];

          return { ...prev, titles, works: rest };
        });
      },
      [setStored],
    ),
    workUrls: stored.works,
  };
}
