"use client";
import { createContext, useCallback, useContext, useMemo } from "react";
import { useLocalStorage } from "usehooks-ts";
import authClient from "@/app/authClient";
import { markOpen } from "@/app/opens";
import { type DateKey } from "@/types/work";

/**
 * 開いた回を覚えておく。目印は回のURLで、開いた日を値に持つ。
 * 毎日確認する道具なので、「これはもう読んだ」が分かるだけで往復が減る。
 *
 * ログインしているあいだは、開くたびにサーバーへも書く。手元はその写しになる。
 * 読み出しは手元から行うので、書き込みが遅れても画面は待たない。
 */
const key = "opened-works";
/** 記録を残す日数。一覧は7日ぶんしか持たないので、これだけあれば取りこぼさない */
const keepDays = 30;
const dayMs = 24 * 60 * 60 * 1000;

export type Opened = {
  /** 控えてある記録の全部。URLから開いた日へ。合流のときに丸ごと渡す */
  all: Record<string, string>;
  /**
   * その日のぶんとして既読か。
   * ツイ４のように話が変わってもURLが変わらないサイトがあるため、
   * URLが同じでも、開いたのがその日より前なら未読として扱う。
   */
  isOpened: (url: string, date: DateKey) => boolean;
  markOpened: (url: string) => void;
  /** 受け取った記録で丸ごと書き換える。ログインしたときの合流で使う */
  replaceAll: (next: Record<string, string>) => void;
};

function dateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(
    date,
  );
}

/**
 * 既読を読み書きする本体。呼ぶのは OpenedProvider だけ。
 * 理由は useFavorites と同じで、カードごとに購読を持たせない。
 */
export function useOpenedState(): Opened {
  const { data: session } = authClient.useSession();
  const signedIn = session !== null;
  // サーバ側では空になるため、読み出しは描画後にする（表示のズレを避ける）
  const [opened, setOpened] = useLocalStorage<Record<string, string>>(
    key,
    {},
    { initializeWithValue: false },
  );
  const isOpened: Opened["isOpened"] = useCallback(
    (url, date) => {
      const at = opened[url];

      return at !== undefined && at >= date;
    },
    [opened],
  );
  const markOpened: Opened["markOpened"] = useCallback(
    (url) => {
      const now = dateKey(new Date());

      if (signedIn) {
        void markOpen(url, now);
      }

      setOpened((prev) => {
        const today = now;
        // 古い記録は捨てる。一覧から消えた回を抱えても使い道がない
        const cutoff = dateKey(new Date(Date.now() - keepDays * dayMs));
        const kept = Object.entries(prev).filter(
          ([, value]) => value >= cutoff,
        );

        return { ...Object.fromEntries(kept), [url]: today };
      });
    },
    [setOpened, signedIn],
  );
  const replaceAll: Opened["replaceAll"] = useCallback(
    (next) => {
      setOpened(next);
    },
    [setOpened],
  );

  // 包まないと、配る値が描き直しのたびに別物になり、受け取る側が全員描き直す
  return useMemo(
    () => ({ all: opened, isOpened, markOpened, replaceAll }),
    [isOpened, markOpened, opened, replaceAll],
  );
}

export const OpenedContext = createContext<null | Opened>(null);

/** 既読の読み書き。値は Provider が持っている1つを共有する */
export default function useOpened(): Opened {
  const value = useContext(OpenedContext);

  if (value === null) {
    throw new Error("OpenedProvider の中で使ってください");
  }

  return value;
}
