"use client";
import { useRouter } from "next/navigation";
import { type TouchEvent, useRef } from "react";
import { nextTabHref, tabHrefs, weekOrder } from "./tabRoutes";

/** これ以上横に動いたらスワイプと見なす */
const distanceThreshold = 60;
/** 縦揺れをスワイプと取り違えないための、横と縦の比 */
const directionRatio = 1.5;
/** ゆっくり指を這わせただけの動きは切り替えにしない */
const timeLimit = 600;

export type SwipeTabsHandlers = {
  onTouchEnd: (event: TouchEvent) => void;
  onTouchStart: (event: TouchEvent) => void;
};

type Start = {
  time: number;
  x: number;
  y: number;
};

/** 横スクロールする要素の上では、スワイプをその要素に譲る */
function insideHorizontalScroller(target: EventTarget | null): boolean {
  let node = target instanceof Element ? target : null;

  while (node !== null) {
    if (
      node.scrollWidth > node.clientWidth + 1 &&
      ["auto", "scroll"].includes(getComputedStyle(node).overflowX)
    ) {
      return true;
    }

    node = node.parentElement;
  }

  return false;
}

/**
 * モバイルで左右にスワイプしたとき、ナビの並びの隣のページへ移る。
 * 返ってきたハンドラを、画面を覆う要素に渡して使う。
 * 並びと現在地は指を離したときに読む。持っていると描画が1回増える。
 */
export default function useSwipeTabs(): SwipeTabsHandlers {
  const router = useRouter();
  const start = useRef<null | Start>(null);

  return {
    onTouchEnd: (event: TouchEvent): void => {
      const from = start.current;
      const touch = event.changedTouches[0];

      start.current = null;

      if (from === undefined || from === null || touch === undefined) {
        return;
      }

      const x = touch.clientX - from.x;
      const y = touch.clientY - from.y;

      if (
        Date.now() - from.time > timeLimit ||
        Math.abs(x) < distanceThreshold ||
        Math.abs(x) < Math.abs(y) * directionRatio
      ) {
        return;
      }

      // 左へ払ったら次のタブ、右へ払ったら前のタブ
      const href = nextTabHref(
        tabHrefs(weekOrder(new Date().getDay())),
        window.location.pathname,
        x < 0 ? 1 : -1,
      );

      if (href === undefined) {
        return;
      }

      router.push(href);
    },
    onTouchStart: (event: TouchEvent): void => {
      const touch = event.touches[0];

      if (
        event.touches.length !== 1 ||
        touch === undefined ||
        !window.matchMedia("(width < 768px)").matches ||
        insideHorizontalScroller(event.target)
      ) {
        start.current = null;

        return;
      }

      start.current = { time: Date.now(), x: touch.clientX, y: touch.clientY };
    },
  };
}
