"use client";
import { useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";

/**
 * 開いた回を覚えておく。話数ごとにURLが違うので、一度開いた回はずっと既読のまま。
 * 毎日確認する道具なので、「これはもう読んだ」が分かるだけで往復が減る。
 */
const key = "opened-works";
/** 記録を残す日数。一覧は7日ぶんしか持たないので、これだけあれば取りこぼさない */
const keepDays = 30;
const dayMs = 24 * 60 * 60 * 1000;

export type Opened = {
  /** 同じ回が複数サイトにあるとき、どれか1つ開いていれば既読とみなす */
  isOpened: (urls: string[]) => boolean;
  markOpened: (urls: string[]) => void;
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
      (urls) => urls.some((url) => opened[url] !== undefined),
      [opened],
    ),
    markOpened: useCallback(
      (urls) => {
        setOpened((prev) => {
          const today = dateKey(new Date());
          // 古い記録は捨てる。一覧から消えた回を抱えても使い道がない
          const cutoff = dateKey(new Date(Date.now() - keepDays * dayMs));
          const kept = Object.entries(prev).filter(
            ([, value]) => value >= cutoff,
          );
          const marked = urls.map((url): [string, string] => [url, today]);

          return {
            ...Object.fromEntries(kept),
            ...Object.fromEntries(marked),
          };
        });
      },
      [setOpened],
    ),
  };
}
