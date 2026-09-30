"use client";
import { useRouter } from "next/navigation";
import { type RefObject, type TouchEvent, useRef } from "react";
import { nextTabHref, tabHrefs, tabLabel, weekOrder } from "./tabRoutes";

/** これ以上横に動いたらスワイプと見なす */
const distanceThreshold = 60;
/** 縦揺れをスワイプと取り違えないための、横と縦の比 */
const directionRatio = 1.5;
/** これより小さな横の揺れでは、行き先の札を出さない */
const hintThreshold = 12;

export type SwipeTabsHandlers = {
  onTouchCancel: () => void;
  onTouchEnd: (event: TouchEvent) => void;
  onTouchMove: (event: TouchEvent) => void;
  onTouchStart: (event: TouchEvent) => void;
};

export type SwipeTabs = {
  handlers: SwipeTabsHandlers;
  /** 行き先の札。指を動かしている間だけ、ここを直に書き換えて見せる */
  hintRef: RefObject<HTMLDivElement | null>;
};

type Start = {
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

/** 横へ払ったとき、移る先のページ。左へ払ったら次、右へ払ったら前 */
function destinationOf(x: number): string | undefined {
  return nextTabHref(
    tabHrefs(weekOrder(new Date().getDay())),
    window.location.pathname,
    x < 0 ? 1 : -1,
  );
}

/** 横への動きとして数えてよいか。縦に流しているだけなら数えない */
function isSideways(x: number, y: number): boolean {
  return Math.abs(x) >= Math.abs(y) * directionRatio;
}

/**
 * モバイルで左右にスワイプしたとき、ナビの並びの隣のページへ移る。
 * 返ってきたハンドラを画面を覆う要素に、hintRef を行き先の札に渡して使う。
 * 並びと現在地は指を動かしたときに読む。持っていると描画が1回増える。
 *
 * 指を動かしている間は、行き先の名前を画面の端から出す。離せば移る距離に届いたら
 * 札の色を変える。これが無いと、払ったのが効いているのか分からず不安になる。
 * 一覧は数百枚のカードを抱えているので、札は React を通さずに直接書き換える。
 */
export default function useSwipeTabs(): SwipeTabs {
  const router = useRouter();
  const start = useRef<null | Start>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const hideHint = (): void => {
    const hint = hintRef.current;

    if (hint !== null) {
      hint.dataset.side = "";
    }
  };

  return {
    handlers: {
      onTouchCancel: (): void => {
        start.current = null;
        hideHint();
      },
      onTouchEnd: (event: TouchEvent): void => {
        const from = start.current;
        const touch = event.changedTouches[0];

        start.current = null;
        hideHint();

        if (from === null || touch === undefined) {
          return;
        }

        const x = touch.clientX - from.x;
        const y = touch.clientY - from.y;

        /*
         * 以前は 0.6秒より遅い動きを切り替えにしなかった。札で届いたかどうかが
         * 見えるようになり、見ながらゆっくり払う人を弾くことになるので、やめた
         */
        if (Math.abs(x) < distanceThreshold || !isSideways(x, y)) {
          return;
        }

        const href = destinationOf(x);

        if (href !== undefined) {
          router.push(href);
        }
      },
      onTouchMove: (event: TouchEvent): void => {
        const from = start.current;
        const touch = event.touches[0];
        const hint = hintRef.current;

        if (from === null || touch === undefined || hint === null) {
          return;
        }

        const x = touch.clientX - from.x;
        const y = touch.clientY - from.y;
        const href =
          Math.abs(x) >= hintThreshold && isSideways(x, y)
            ? destinationOf(x)
            : undefined;
        const label =
          href === undefined ? undefined : tabLabel(href, new Date());

        if (label === undefined) {
          hideHint();

          return;
        }

        // 左へ払うと次のページが右から来る。札も来る側の端に出す
        hint.dataset.side = x < 0 ? "right" : "left";
        hint.dataset.armed = String(Math.abs(x) >= distanceThreshold);
        hint.style.setProperty(
          "--swipe-progress",
          String(Math.min(Math.abs(x) / distanceThreshold, 1)),
        );

        if (hint.textContent !== label) {
          hint.textContent = label;
        }
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
          hideHint();

          return;
        }

        start.current = { x: touch.clientX, y: touch.clientY };
      },
    },
    hintRef,
  };
}
