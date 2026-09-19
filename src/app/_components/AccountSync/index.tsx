"use client";
import { useEffect, useRef } from "react";
import authClient from "@/app/authClient";
import { mergeFollows, readFollows } from "@/app/follows";
import { mergeOpens, readOpens } from "@/app/opens";
import useFavorites from "@/app/useFavorites";
import useOpened from "@/app/useOpened";

/**
 * ログインしているあいだ、開くたびにサーバーの登録と既読を手元へ取り込む。
 * 別の端末で押したぶんは、ここを通らないと届かない。
 *
 * ログインした最初の一度だけは、取り込む前に端末に溜まっていたぶんをサーバーへ足す。
 * 足すだけで消さない。ここで消すと「登録したのに」が起きる。
 * 2回目以降は読むだけにする。毎回足すと、別の端末で外した登録をこの端末が生き返らせる。
 * 足したかどうかは利用者ごとに手元へ控える。別のアカウントで入り直したら、
 * その人のぶんとしてもう一度足す。
 *
 * 画面には何も出さない。
 */
const syncedKey = "favorites-synced-v1";
/** 往復中に登録が押されたとき、読み直す回数の上限 */
const maxReads = 3;

/**
 * 登録の中身が同じか。配列は書き込みのたびに読み直されて別物になるので、中身で比べる
 */
function sameFollows(
  a: { siteUrls: string[]; workUrls: string[] },
  b: { siteUrls: string[]; workUrls: string[] },
): boolean {
  return (
    a.workUrls.join("\n") === b.workUrls.join("\n") &&
    a.siteUrls.join("\n") === b.siteUrls.join("\n")
  );
}

export default function AccountSync(): null {
  const { data: session, isPending } = authClient.useSession();
  const favorites = useFavorites();
  const opened = useOpened();
  // 往復のあいだに押された登録を見分けるため、最新の値をいつでも覗けるようにする
  const latest = useRef(favorites);
  // 取り込みは往復するあいだに何度も描き直される。1回の表示で1人につき一度だけ走らせる
  const pulledFor = useRef<null | string>(null);
  const userId = session?.user.id ?? null;

  useEffect(() => {
    latest.current = favorites;
  }, [favorites]);

  useEffect(() => {
    // 取りに行っている間はログイン中でも null になる。そこで控えを消すと、合流をやり直してしまう
    if (isPending) {
      return;
    }

    if (userId === null) {
      pulledFor.current = null;

      try {
        localStorage.removeItem(syncedKey);
      } catch {
        // 端末が控えを持てなくても、次のログインで合流し直すだけ
      }

      return;
    }

    if (pulledFor.current === userId) {
      return;
    }

    pulledFor.current = userId;

    const first = localStorage.getItem(syncedKey) !== userId;
    const before = latest.current;

    void Promise.all([
      first
        ? mergeFollows({ sites: before.siteUrls, works: before.workUrls })
        : readFollows(),
      first ? mergeOpens(opened.all) : readOpens(),
    ]).then(async ([firstFollows, opens]) => {
      // 既読は日付の新しい方を採って足すので、往復中に開いた回も消えない
      opened.mergeAll(opens);

      /*
       * 登録は外したことも写すので、丸ごと置き換える。
       * 往復中に押されていたら、その書き込みはこの読み出しの後ろに並んでいる。
       * 読み直せば入っている
       */
      let follows = firstFollows;
      let seen = before;

      for (let count = 1; count < maxReads; count += 1) {
        if (sameFollows(latest.current, seen)) {
          break;
        }

        seen = latest.current;
        follows = await readFollows();
      }

      // 題名はサーバーが台帳から引いて返す。手元の控えは埋まらないぶんだけ使う
      const local = Object.entries(latest.current.titles).filter(([entry]) =>
        follows.works.includes(entry),
      );

      latest.current.replaceAll({
        ...follows,
        titles: { ...Object.fromEntries(local), ...follows.titles },
      });
      localStorage.setItem(syncedKey, userId);

      return follows;
    });
  }, [isPending, opened, userId]);

  return null;
}
