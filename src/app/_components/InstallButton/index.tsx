"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { createPortal } from "react-dom";
import { MdInstallMobile } from "react-icons/md";
import usePwa from "use-pwa";
import useIsHydrated from "@/app/useIsHydrated";
import styles from "./style.module.css";

const PWAPrompt = dynamic(async () => import("react-ios-pwa-prompt"), {
  ssr: false,
});

/**
 * ホーム画面への追加を案内できる端末か。
 * iPad の Safari は Mac を名乗るため、触れる Mac も iPad とみなす。
 * react-ios-pwa-prompt 側の判定に合わせている。
 */
function isAppleDevice(): boolean {
  const userAgent = window.navigator.userAgent.toLowerCase();

  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    (userAgent.includes("macintosh") && window.navigator.maxTouchPoints > 1)
  );
}

/**
 * インストールの入り口。押したときだけ案内を出す。
 * Chrome 系はブラウザの確認、iOS は手順の案内を開く。
 */
export default function InstallButton(): null | React.JSX.Element {
  const { canInstallprompt, enabledPwa, isPwa, showInstallPrompt } = usePwa();
  const [isGuideShown, setIsGuideShown] = useState(false);
  // 組み上がるまでは window を見られない。サーバー側では Apple 端末と決められない
  const isApple = useIsHydrated() && isAppleDevice();
  const canPrompt = enabledPwa && canInstallprompt;

  if (isPwa || (!canPrompt && !isApple)) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => {
          if (canPrompt) {
            showInstallPrompt();

            return;
          }

          setIsGuideShown(true);
        }}
        className={styles.button}
        type="button"
      >
        <MdInstallMobile className={styles.icon} />
        <span className={styles.label}>インストール</span>
      </button>
      {isApple && !canPrompt
        ? createPortal(
            <PWAPrompt
              onClose={() => {
                setIsGuideShown(false);
              }}
              appIconPath="/apple-icon.png"
              copyAddToHomeScreenStep="2. [ホーム画面に追加] をタップします。"
              copyDescription="このサイトはアプリとして使用できます。ホーム画面に追加すると、全画面表示やオフラインでの利用が可能になります。"
              copyShareStep="1. 共有アイコン（四角から矢印が出たアイコン）をタップします。"
              copyTitle="ホーム画面に追加"
              delay={100}
              isShown={isGuideShown}
            />,
            document.body,
          )
        : null}
    </>
  );
}
