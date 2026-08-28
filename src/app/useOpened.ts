"use client";
import { useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";
import { type DateKey } from "@/types/work";

/**
 * 開いた回を覚えておく。目印は回のURLで、開いた日を値に持つ。
 * 毎日確認する道具なので、「これはもう読んだ」が分かるだけで往復が減る。
 */
const key = "opened-works";
/** 記録を残す日数。一覧は7日ぶんしか持たないので、これだけあれば取りこぼさない */
const keepDays = 30;
const dayMs = 24 * 60 * 60 * 1000;

export type Opened = {
  /**
   * その日のぶんとして既読か。
   * ツイ４のように話が変わってもURLが変わらないサイトがあるため、
   * URLが同じでも、開いたのがその日より前なら未読として扱う。
   */
  isOpened: (url: string, date: DateKey) => boolean;
  markOpened: (url: string) => void;
};

function dateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(
    date,
  );
}

export default function useOpened(): Opened {
  // サーバ側では空になるため、読み出しは描画後にする（表示のズレを避ける）
  const [opened, setOpened] = useLocalStorage<Record<string, string>>(
    key,
    {},
    { initializeWithValue: false },
  );

  return {
    isOpened: useCallback(
      (url, date) => {
        const at = opened[url];

        return at !== undefined && at >= date;
      },
      [opened],
    ),
    markOpened: useCallback(
      (url) => {
        setOpened((prev) => {
          const today = dateKey(new Date());
          // 古い記録は捨てる。一覧から消えた回を抱えても使い道がない
          const cutoff = dateKey(new Date(Date.now() - keepDays * dayMs));
          const kept = Object.entries(prev).filter(
            ([, value]) => value >= cutoff,
          );

          return { ...Object.fromEntries(kept), [url]: today };
        });
      },
      [setOpened],
    ),
  };
}
