"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MdInstallMobile } from "react-icons/md";
import usePwa from "use-pwa";
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
  const [isApple, setIsApple] = useState(false);
  const [isGuideShown, setIsGuideShown] = useState(false);

  useEffect(() => {
    setIsApple(isAppleDevice());
  }, []);

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
              copyAddToHomeScreenStep="2) 「ホーム画面に追加」をタップします。"
              copyDescription="このウェブサイトにはアプリ機能があります。ホーム画面に追加してフルスクリーンおよびオフラインで使用できます。"
              copyShareStep="1) （四角から矢印が飛び出したマーク）をタップします。"
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
