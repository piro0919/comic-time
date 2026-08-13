"use client";
import { useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";

/**
 * その日に開いた作品を覚えておく。
 * 毎日確認する道具なので、「今日もう開いたか」が分かるだけで往復が減る。
 */
const key = "opened-works";

export type Opened = {
  isOpened: (url: string) => boolean;
  markOpened: (url: string) => void;
};

function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(
    new Date(),
  );
}

export default function useOpened(): Opened {
  const [opened, setOpened] = useLocalStorage<Record<string, string>>(
    key,
    {},
    { initializeWithValue: false },
  );

  return {
    isOpened: useCallback((url) => opened[url] === today(), [opened]),
    markOpened: useCallback(
      (url) => {
        setOpened((prev) => {
          const date = today();
          // 前日までの記録は捨てる。増え続けても使い道がない
          const kept = Object.entries(prev).filter(
            ([, value]) => value === date,
          );

          return { ...Object.fromEntries(kept), [url]: date };
        });
      },
      [setOpened],
    ),
  };
}
