"use client";
import { useEffect, useRef } from "react";
import authClient from "@/app/authClient";
import { mergeFollows } from "@/app/follows";
import useFavorites from "@/app/useFavorites";

/**
 * ログインした最初の一度だけ、端末に溜まっていた登録をサーバーへ合流させる。
 *
 * 足すだけで消さない。ここで消すと「登録したのに」が起きる。
 * 合流が済んだらサーバーが正本になるので、以降は押すたびの書き込みだけで揃う。
 * 済んだかどうかは利用者ごとに手元へ控える。別のアカウントで入り直したら、
 * その人のぶんとしてもう一度合流する。
 *
 * 画面には何も出さない。
 */
const syncedKey = "favorites-synced-v1";

export default function FollowSync(): null {
  const { data: session } = authClient.useSession();
  const favorites = useFavorites();
  // 合流は往復するあいだに何度も描き直される。走らせるのは一度だけにする
  const running = useRef(false);
  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (userId === null) {
      try {
        localStorage.removeItem(syncedKey);
      } catch {
        // 端末が控えを持てなくても、次のログインで合流し直すだけ
      }

      return;
    }

    if (running.current || localStorage.getItem(syncedKey) === userId) {
      return;
    }

    running.current = true;

    void mergeFollows({
      sites: favorites.siteUrls,
      works: favorites.workUrls,
    })
      .then((merged) => {
        // 題名はサーバーが台帳から引いて返す。手元の控えは埋まらないぶんだけ使う
        const local = Object.entries(favorites.titles).filter(([entry]) =>
          merged.works.includes(entry),
        );

        favorites.replaceAll({
          ...merged,
          titles: { ...Object.fromEntries(local), ...merged.titles },
        });
        localStorage.setItem(syncedKey, userId);

        return merged;
      })
      .finally(() => {
        running.current = false;
      });
  }, [favorites, userId]);

  return null;
}
